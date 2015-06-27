(function (exports) { "use strict";

/**
 * Holds the listener to be called by the Signal (and provides properties for a simple linked list).
 * @author Kevin Newman
 */
function SlotLite( listener, target ) {
	this.next = null; // SlotLite
	this.prev = null; // SlotLite
	this.listener = listener; // Function
	this.target = target;
}

/**
 * A lite version of Robert Penner's AS3 Signals, for JavaScript.
 * @param target The value of this in listeners when dispatching.
 * @param eachReturn A callback to handle the return value of each listener.
 * @author Kevin Newman
 */
function SignalLite( target, eachReturn )
{
	/**
	 * The empty first slot in a linked set.
	 * @private
	 */
	this.first = new SlotLite;
	
	/**
	 * The last Slot is initially a reference to the same slot as the first.
	 * @private
	 */
	this.last = this.first;
	
	/**
	 * The value of this in listeners when dispatching.
	 */
	this.target = target;
	
	/**
	 * A callback to handle the return value of each listener.
	 */
	this.eachReturn = eachReturn;
	
	/**
	 * A simple flag to say if we are dispatching. Used by stopDispatch.
	 * @private
	 */
	this.dispatching = false;
}

var cutNode = SignalLite._cutNode = function( node )
{
	node.prev.next = node.next;
	if ( node.next )
		node.next.prev = node.prev;
	if ( this.last === node )
		this.last = node.prev;
};

SignalLite.prototype = {
	/**
	 * Add a listener for this Signal.
	 * @param listener The function to be called when the signal fires.
	 * @param target The value of this in listeners when dispatching only this listener.
	 */
	add: function( listener, target )
	{
		if ( this.has( listener ) ) return;
		this.last.next = new SlotLite( listener, target );
		this.last.next.prev = this.last;
		this.last = this.last.next;
		return this.target;
	},
	
	/**
	 * Add a listener for this Signal in the first position.
	 * Pushes the first item to the second position. If the listener
	 * is already registered, it'll move it to the top.
	 * @param listener The function to be called when the signal fires.
	 * @param target The value of this in listeners when dispatching only this listener.
	 */
	addToTop: function( listener, target )
	{
		if ( this.has( listener ) ) {
			this.remove( listener );
			this.addToTop( listener );
		}
		var slot = new SlotLite( listener, target );
		slot.next = this.first.next;
		slot.prev = this.first;
		this.first.next.prev = slot;
		this.first.next = slot;
		return this.target;
	},
	
	/**
	 * Checks if the Signal contains a specific listener.
	 * @param listener The listener to check for.
	 * @return Whether or not the listener is in the queue for this signal.
	 */
	has: function( listener )
	{
		if ( this.first === this.last ) return false;
		
		var node = this.first;
		do {
			if ( node.next && node.next.listener === listener ) {
				return true;
			}
		}
		while( node = node.next );
		
		return false;
	},
	
	/**
	 * Gets the number of listeners.
	 */
	getLength: function()
	{
		var count = 0;
		
		var node = this.first;
		while ( node = node.next ) {
			++count;
		}
		
		return count;
	},
	
	/**
	 * My mother told a listener once. Once.
	 * @param listener The function to be called when the signal fires.
	 * @param target The value of this in listeners when dispatching only this listener.
	 */
	once: function( listener, target )
	{
		var that = this;
		function oneTime() {
			that.remove( oneTime );
			listener.apply( this, arguments );
		}
		return this.add( oneTime, target );
	},
	
	/**
	 * Remove a listener for this Signal.
	 * @param listener The function to be removed from the signal.
	 */
	remove: function( listener )
	{
		if (this.first === this.last ) return;

		var node = this.first;
		
		while ( node = node.next ) {
			if ( node.listener === listener ) {
				cutNode.call( this, node );
				break;
			}
		}
		
		if ( this.first === this.last )
			this.first.next = null;

		return this.target;
	},
	
	/**
	 * Remove all listeners from this Signal.
	 */
	removeAll: function()
	{
		this.first.next = null;
		this.first.prev = null;
		this.last = this.first;

		return this.target;
	},
	
	/**
	 * jQuery style trigger - fast, manual error handling recommended.
	 * SignalLite.trigger does not use safe dispatching, but
	 * is lightening fast compared with SignalLite.dispatch. Use with caution.
	 */
	trigger: function()
	{
		if ( this.first === this.last ) return;
		
		this.dispatching = true;
		
		var args = Array.prototype.slice.call(arguments),
			node = this.first;
		
		while ( (node = node.next) && this.dispatching )
		{
			var val = node.listener.apply(
				node.target || this.target, args
			);
			if ( this.eachReturn )
				this.eachReturn( val, args );
		}
		
		this.dispatching = false;

		return this.target;
	},
	
	stopDispatch: function() {
		this.dispatching = false;
		return this.target;
	}
};

// This has to be assigned here, rather than inline because of bugs in IE7/IE8
exports.SignalLite = SignalLite;
exports.SlotLite = SlotLite;

})(this.exports || this);
