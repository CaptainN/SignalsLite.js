(function( undefined ) { "use strict";

var SIGNAL_EVENT = "SignalLiteEvent",
	signal_key = 0,
	_namespace = null,
	ua = navigator.userAgent,
	isFirefox = ua.indexOf( "compatible" ) < 0 &&
		/Mozilla(.*)rv:(.*)Gecko/.test( ua );

/**
 * Holds the listener to be called by the Signal (and provides properties for a simple linked list).
 * @author Kevin Newman
 */
function SlotLite( listener, target ) {
	this.next = null; // SlotLite
	this.prev = null; // SlotLite
	this.listener = listener; // Function
	this.target = target;
	this.namespace = null;
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
	
	var signal = this;
	
	this.ns = {
		add: function( namespace )
		{
			signal[ namespace ] = {
				add: function( listener, target )
				{
					_namespace = namespace;
					signal.add( listener, target );
					_namespace = null;
				},
				remove: function()
				{
					_namespace = namespace;
					signal.remove();
					_namespace = null;
				},
				once: function( listener, target )
				{
					_namespace = namespace;
					signal.once( listener, target );
					_namespace = null;
				}
			};
		},
		remove: function( namespace ) {
			delete signal[ namespace ];
		}
	};
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
		this.last.namespace = _namespace;
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
	remove: function remove( listener )
	{
		if ( this.first === this.last ) return;
		
		var node = this.first;
		
		function cutNode()
		{
			node.prev.next = node.next;
			if ( node.next )
				node.next.prev = node.prev;
			if ( this.last === node )
				this.last = node.prev;
		}
		
		while ( node.next )
		{
			node = node.next;
			
			if ( _namespace && node.namespace == _namespace ) {
				cutNode.apply( this );
			}
			else if ( node.listener === listener ) {
				cutNode.apply( this );
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
		if ( this.first === this.last ) return;
		
		var args = arguments;
		var sigEvtName = SIGNAL_EVENT + (++signal_key);
		
		function getSignalClosure( listener, target ) {
			return function closure() {
				document.removeEventListener( sigEvtName, listener, false );
				try {
					listener.apply( target, args );
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
		
		// Building this dispatch list essentially copies the dispatch list, so 
		// add/removes during dispatch won't have any effect. BONUS~!
		var node = this.first;
		while ( node = node.next ) {
			document.addEventListener( sigEvtName,
				getSignalClosure( node.listener,
					node.target || this.target
				), false
			);
		}
		
		var se = document.createEvent( "UIEvents" );
		se.initEvent( sigEvtName, false, false );
		document.dispatchEvent( se );
	}
};

// IE 8 and lower
if ( !document.addEventListener )
{
	var elm = document.documentElement;
	
	SignalLite.prototype.dispatch = function()
	{
		if ( this.first === this.last ) return;
		
		var sigEvtName = SIGNAL_EVENT + (++signal_key);
		
		elm[ sigEvtName ] = 0;
		
		var args = arguments;
		function getSignalClosure( listener, target ) {
			return function( event )
			{
				if (event.propertyName == sigEvtName) {
					elm.detachEvent( "onpropertychange",
						 // using named inline function ref didn't work here...
						arguments.callee, false
					);
					listener.apply( target, args );
				}
			};
		}
		
		// NOTE: IE dispatches in reverse order, so we need to
		// attach the events backwards.
		var node = this.last;
		do {
			if (this.first == node)
				break;
			
			elm.attachEvent( "onpropertychange",
				getSignalClosure( node.listener,
					node.target || this.target
				), false
			);
		}
		while ( node = node.prev );
		
		// triggers the property change event
		elm[ sigEvtName ]++;
		elm[ sigEvtName ] = null;
	};
}

// This has to be assigned here, rather than inline because of bugs in IE7/IE8
window.SignalLite = SignalLite;

})();
