(function() { "use strict";

/**
 * Holds the listener to be called by the Signal (and provides properties for a simple linked list).
 * @author Kevin Newman
 */
function SlotLite() {
	this.next = null; // SlotLite
	this.prev = null; // SlotLite
	this.listener = null; // Function
}

/**
 * A lite version of Robert Penner's AS3 Signals, for JavaScript.
 * @author Kevin Newman
 */
window.SignalLite = function SignalLite()
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
};

SignalLite.prototype = {
	/**
	 * Add a listener for this Signal.
	 * @param listener Function The function to be called when the signal fires.
	 */
	add: function addListener( listener )
	{
		if ( this.has( listener ) ) return;
		this.last.next = new SlotLite;
		this.last.next.prev = this.last;
		this.last = this.last.next;
		this.last.listener = listener;
	},
	
	/**
	 * Checks if the Signal contains a specific listener.
	 * @param	listener The listener to check for.
	 * @return Whether or not the listener is in the queue for this signal.
	 */
	has: function hasListener( listener )
	{
		if ( this.first === this.last ) return false;
		
		var node = this.first;
		do {
			if ( node.next.listener === listener ) {
				return true;
			}
		}
		while( node = node.next && node.next );
		
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
	 * @param	listener
	 */
	once: function addOnce( listener )
	{
		var that = this;
		function oneTime() {
			that.remove( oneTime );
			listener.apply( null, arguments );
			listener = undefined;
			that = undefined;
		}
		this.add( oneTime );
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
			node.listener.apply( null, arguments );
		}
	}
};

})();