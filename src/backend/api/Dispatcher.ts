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

import * as spec from "../spec/index";

const MAX_RETAINED_EVENTS = 10000;

interface IEventWaiter {
    (events: spec.Event[]): void;
};

export class Dispatcher {
    private _nextId: number = 1;
    private _events: spec.Event[] = []; 
    private _eventWaiters: IEventWaiter[] = [];
    
    public sendEvent(type: spec.EventType, data: spec.IEventData): void {
        // store the event at the end of the _events array
        var event = new spec.Event();
        event.eventId = this._nextId++;
        event.eventType = type;
        event.eventData = data;
        event.eventDate = new Date();
        this._events.push(event);
        
        // delete the oldest events so we're under the preset limit
        while (this._events.length > MAX_RETAINED_EVENTS) {
            this._events.shift();
        }
        
        // notify all waiting callers
        this._eventWaiters.forEach(waiter => {
            waiter([event]);
        });
        this._eventWaiters = [];
        
        console.log("Event #" + event.eventId + ": " + event.eventType);
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
            this._eventWaiters.push(events => {
                resolve(events);
            });
        });
    }
    
    public getNewestEventId(): number {
        return this._nextId - 1;
    }
}
