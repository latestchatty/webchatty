// WebChatty
// Copyright (C) 2015 Andy Christianson, Brian Luft, Willie Zutz
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
// Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
// OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/// <reference path="../../../typings/tsd.d.ts" />
"use strict";

import * as lodash from "lodash";
import * as api from "./index";
import * as spec from "../spec/index";

const MAX_EVENTS = 11000;
const PRUNE_EVENTS = 10000;

interface IEventWaiter {
    expirationMsec: number;
    resolve(events: spec.Event[]): void;
};

export class Dispatcher {
    private _server: api.Server;
    private _nextId: number = 1;
    private _events: spec.Event[] = []; 
    private _eventWaiters: IEventWaiter[] = [];
    private _sendQueue: spec.Event[] = [];
    private _wakeMessageLoop: () => void; // call this when pushing onto sendQueue
    
    public newEventSignal: spec.Signal<spec.Event> = new spec.Signal<spec.Event>();
    
    public injectServer(server: api.Server): void {
        this._server = server;
        
        // every 2.5 seconds, prune the list of event waiters according to their expiration time
        // a pruned event waiter will receive an empty list of events and a friendly invitation
        // to try again
        setInterval(() => {
            const now = new Date().getTime();
            this._eventWaiters.forEach(waiter => {
                if (waiter.expirationMsec <= now) {
                    waiter.resolve([]);
                    waiter.resolve = null;
                }
            });
            this._eventWaiters = lodash.filter(this._eventWaiters, x => x.resolve !== null);
        }, 2500).unref();
        
        this.startMessageLoop();
    }
    
    private startMessageLoop(): void {
        this.messageLoop()
            .then(() => {
                return this.messageLoop();
            })
            .catch(ex => {
                this._server.log("error", "Message loop error: " + ex.toString() + " -- " + (ex instanceof Error ? ex.stack : ""));
                this.startMessageLoop();
            });
    }
    
    public async sendEvent(type: spec.EventType, data: spec.IEventData): Promise<void> {
        const event = {
            eventId: this._nextId++,
            eventType: type,
            eventData: data,
            eventDate: new Date()
        };
        this._sendQueue.push(event);
        this._wakeMessageLoop();
    }

    private sleep(): Promise<void> {
        var didResolve = false;
        return new Promise<void>((resolve, reject) => {
            // when a new event comes in, this function will be called which will resolve the sleep() promise.
            this._wakeMessageLoop = () => {
                if (!didResolve) {
                    didResolve = true;
                    resolve();
                }
            };
        });
    }

    // this ensures that the asynchronous process of sending an event is not interrupted when a new event shows up.
    // we process each event fully before moving on to the next queued event.
    private async messageLoop(): Promise<void> {
        while (true) {
            while (this._sendQueue.length === 0) {
                await this.sleep();
            }
            
            const event = this._sendQueue.shift();
            this._events.push(event);
            
            // if we trip the maximum, then delete the oldest events so we're under the prune limit
            if (this._events.length > MAX_EVENTS) {
                this._events = lodash.slice(this._events, this._events.length - PRUNE_EVENTS);
            }
            
            // notify all waiting waitForEvent() callers
            this._eventWaiters.forEach(waiter => {
                // some of the waiters may have timed out, in which case their resolve function is null
                // because we already sent a response
                if (waiter.resolve !== null) {
                    waiter.resolve([event]);
                }
            });
            this._eventWaiters = [];
            
            // this may trigger, e.g., a search index rebuild which could take some time.
            await this.newEventSignal.send(event);
            
            this._server.log("verbose", "Event #" + event.eventId + ": " + event.eventType);
        }
    }
    
    public pollForEvent(lastEventId: number): spec.Event[] {
        if (this._events.length == 0) {
            return [];
        } else if (lastEventId > 0 && lastEventId < this._events[0].eventId) {
            throw spec.apiError("ERR_TOO_MANY_EVENTS", "You have requested too many events.");
        } else {
            // walk backwards (newest to oldest) and grab all the events newer than lastEventId.
            var events: spec.Event[] = [];
            for (var i = this._events.length - 1; i >= 0 && this._events[i].eventId > lastEventId; i--) {
                events.push(this._events[i]);
            }
            return events.reverse(); // oldest to newest
        }
    }
    
    public waitForEvent(lastEventId: number): Promise<spec.Event[]> {
        var existingEvents = this.pollForEvent(lastEventId);
        if (existingEvents.length > 0) {
            return Promise.resolve(existingEvents);
        }
        
        return new Promise((resolve, reject) => {
            this._eventWaiters.push({
                expirationMsec: new Date().getTime() + 20000, // 20 seconds
                resolve: resolve
            });
        });
    }
    
    public getNewestEventId(): number {
        return this._nextId - 1;
    }
}
