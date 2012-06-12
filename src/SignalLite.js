(function() { "use strict";

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
 * @author Kevin Newman
 */
function SignalLite( target )
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
};

SignalLite.prototype = {
	/**
	 * Add a listener for this Signal.
	 * @param listener The function to be called when the signal fires.
	 * @param target The value of this in listeners when dispatching only this listener.
	 */
	add: function add( listener, target )
	{
		if ( this.has( listener ) ) return;
		this.last.next = new SlotLite( listener, target );
		this.last.next.prev = this.last;
		this.last = this.last.next;
	},
	
	/**
	 * Checks if the Signal contains a specific listener.
	 * @param listener The listener to check for.
	 * @return Whether or not the listener is in the queue for this signal.
	 */
	has: function has( listener )
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
	getLength: function getLength()
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
	once: function once( listener, target )
	{
		var that = this;
		function oneTime() {
			that.remove( oneTime );
			listener.apply( this, arguments );
			listener = undefined;
			that = undefined;
		}
		this.add( oneTime, target );
	},
	
	/**
	 * Remove a listener for this Signal.
	 */
	remove: function removeListener( listener )
	{
		if ( this.first === this.last ) return;
		
		var node = this.first;
		
		while ( node.next )
		{
			node = node.next;
			
			if ( node.listener === listener )
			{
				node.prev.next = node.next;
				if ( node.next )
					node.next.prev = node.prev;
				if ( this.last === node )
					this.last = node.prev;
				break;
			}
		}
		
		if ( this.first === this.last ) {
			this.first.next = null;
		}
	},
	
	/**
	 * Dispatches an event.
	 */
	dispatch: function dispatch()
	{
		var node = this.first;
		while ( node = node.next ) {
			node.listener.apply( node.target || this.target, arguments );
		}
	}
};

// This has to be assigned here, rather than inline because of bugs in IE7/IE8
window.SignalLite = SignalLite;

})();