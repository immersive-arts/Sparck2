/* MIT License
 *
 * Copyright (c) 2012-2020 tecartlab.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author maybites
 *
 */

/**
 * Base Command class for the Command Pattern
 * All specific commands should inherit from this
 */
WARP.Command = function() {
    this.name = "BaseCommand";
};

WARP.Command.prototype = {
    constructor: WARP.Command,
    
    execute: function(target) {
        throw new Error("Execute must be implemented");
    },
    
    undo: function(target) {
        throw new Error("Undo must be implemented");
    }
};

/**
 * Command History Manager
 * Manages undo/redo functionality for commands with time-based fencing
 */
WARP.CommandHistory = function(maxSize, fenceTimeMs) {
    this.maxSize = maxSize || 100;
    this.fenceTimeMs = fenceTimeMs || 800; // Default 800ms fence window
    this.history = [];
    this.currentIndex = -1;
    this.lastCommandTime = 0;
    this.lastCommandType = null;
    this.fenceEnabled = true; // Can be toggled on/off
};

WARP.CommandHistory.prototype = {
    constructor: WARP.CommandHistory,
    
    /**
     * Enable/disable command fencing
     */
    setFencing: function(enabled) {
        this.fenceEnabled = enabled;
    },
    
    /**
     * Set fence time window in milliseconds
     */
    setFenceTime: function(timeMs) {
        this.fenceTimeMs = timeMs;
    },
    
    /**
     * Check if command should be fenced with previous command
     */
    shouldFence: function(command) {
        if(!this.fenceEnabled || this.currentIndex < 0){
            return false;
        }
        
        var now = Date.now();
        var timeDelta = now - this.lastCommandTime;
        var lastCommand = this.history[this.currentIndex];
        
        // Fence if:
        // 1. Within time window AND
        // 2. Same command constructor (same type of operation)
        return (timeDelta < this.fenceTimeMs && 
                command.constructor === lastCommand.constructor);
    },
    
    /**
     * Merge a new command with the last command in history
     * This preserves the original state while updating the final state
     */
    mergeWithLast: function(command) {
        var lastCommand = this.history[this.currentIndex];
        
        // Check if the command has a merge method
        if(typeof lastCommand.merge === 'function'){
            lastCommand.merge(command);
            return true;
        }
        
        return false;
    },
    
    /**
     * Execute a command and add it to history
     */
    execute: function(command, target) {
        var now = Date.now();
        
        // Remove any commands after current index (they were undone)
        if(this.currentIndex < this.history.length - 1){
            this.history.splice(this.currentIndex + 1);
        }
        
        // Check if we should fence this command with the previous one
        if(this.shouldFence(command)){
            // Try to merge with last command
            if(this.mergeWithLast(command)){
                // Execute only the delta/difference of the new command
                command.execute(target);
            } else {
                // Fallback: execute and add as new command
                command.execute(target);
                this.history.push(command);
                this.currentIndex++;
            }
        } else {
            // Execute the command
            command.execute(target);
            
            // Add to history
            this.history.push(command);
            this.currentIndex++;
            
            // Trim history if needed
            if(this.history.length > this.maxSize){
                this.history.shift();
                this.currentIndex--;
            }
        }
        
        // Update fence tracking
        this.lastCommandTime = now;
        this.lastCommandType = command.constructor;
    },
    
    /**
     * Undo the last command
     */
    undo: function(target) {
        if(this.currentIndex >= 0){
            this.history[this.currentIndex].undo(target);
            this.currentIndex--;
            return true;
        }
        return false;
    },
    
    /**
     * Redo the next command
     */
    redo: function(target) {
        if(this.currentIndex < this.history.length - 1){
            this.currentIndex++;
            this.history[this.currentIndex].execute(target);
            return true;
        }
        return false;
    },
    
    /**
     * Check if undo is possible
     */
    canUndo: function() {
        return this.currentIndex >= 0;
    },
    
    /**
     * Check if redo is possible
     */
    canRedo: function() {
        return this.currentIndex < this.history.length - 1;
    },
    
    /**
     * Clear all history
     */
    clear: function() {
        this.history = [];
        this.currentIndex = -1;
    }
};
