(function() { "use strict";

var SIGNAL_EVENT = "signalLiteEvent";

var ua = navigator.userAgent;
var isFirefox = ua.indexOf( "compatible" ) < 0 &&
	/Mozilla/.test( ua );

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
	 * Dispatches an event. Uses Dean Edwards DOM dispatching to avoid 
	 * blocking dispatch on error, and to avoid suppressing those errors.
	 * @link http://dean.edwards.name/weblog/2009/03/callbacks-vs-events/
	 */
	dispatch: function dispatch()
	{
		function getSignalClosure( signal, node, args ) {
			return function listener() {
				document.removeEventListener( SIGNAL_EVENT, listener, false );
				try {
					node.listener.apply( node.target || signal.target, args );
				}
				catch ( e ) {
					// Firefox is supporessing this for some reason, so we'll 
					// manually report the error, until I figure out why.
					if ( isFirefox && console )
						console.error( e );
					throw e;
				}
			};
		}
		
		var se = document.createEvent( "UIEvents" );
		se.initEvent( SIGNAL_EVENT, false, false );
		
		var node = this.first;
		
		// Building this dispatch list essentially copies the dispatch list, so 
		// add/removes during dispatch won't have any effect. BONUS~!
		while ( node = node.next ) {
			document.addEventListener( SIGNAL_EVENT,
				getSignalClosure( this, node, arguments ), false
			);
		}
		
		document.dispatchEvent( se );
	}
};

// IE 8 and lower
if ( !document.addEventListener )
{
	document.documentElement[ SIGNAL_EVENT ] = 0;
	
	getSignalClosure = function( signal, node, args ) {
		return function listener( event )
		{
			if (event.propertyName == SIGNAL_EVENT) {
				document.documentElement.detachEvent( "onpropertychange",
					 // using named inline ref (listener) didn't work here...
					arguments.callee, false
				);
				node.listener.apply( node.target || signal.target, args );
			}
		};
	};
	SignalLite.prototype.dispatch = function dispatch()
	{
		var node = this.first;
		while ( node = node.next ) {
			document.documentElement.attachEvent( "onpropertychange",
				getSignalClosure( this, node, arguments ), false
			);
		}
		
		// triggers the property change event
		++document.documentElement[ SIGNAL_EVENT ];
	};
}

// This has to be assigned here, rather than inline because of bugs in IE7/IE8
window.SignalLite = SignalLite;

})();
