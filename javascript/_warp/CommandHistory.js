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
 * Manages undo/redo functionality for commands
 */
WARP.CommandHistory = function(maxSize) {
    this.maxSize = maxSize || 100;
    this.history = [];
    this.currentIndex = -1;
};

WARP.CommandHistory.prototype = {
    constructor: WARP.CommandHistory,
    
    /**
     * Execute a command and add it to history
     */
    execute: function(command, target) {
        // Remove any commands after current index (they were undone)
        if(this.currentIndex < this.history.length - 1){
            this.history.splice(this.currentIndex + 1);
        }
        
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
