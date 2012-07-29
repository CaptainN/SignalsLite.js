(function( undefined ) { "use strict";

var sig_index = 0,
	_ns = null,
	isFirefox = navigator.userAgent.indexOf( "compatible" ) < 0 &&
		/Mozilla(.*)rv:(.*)Gecko/.test( navigator.userAgent );

/**
 * Holds the listener to be called by the Signal (and provides properties for a simple linked list).
 * @author Kevin Newman
 */
function SlotLite( listener, target ) {
	this.next = null; // SlotLite
	this.prev = null; // SlotLite
	this.listener = listener; // Function
	this.target = target;
	this.ns = null;
}

/**
 * A lite version of Robert Penner's AS3 Signals, for JavaScript.
 * @param target The value of this in listeners when dispatching.
 * @param eachReturn A callback to handle the return value of each listener.
 * @param eachError A callback to handle errors in each listener, when they occur.
 * This is especially useful for Firefox which suppresses erros inside listeners.
 * @author Kevin Newman
 */
function SignalLite( target, eachReturn, eachError )
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
	 * A callback to handle errors in each listener, when they occur.
	 */
	this.eachError = eachError;
	
	var signal = this;
	
	this.namespace = {
		add: function( namespace )
		{
			// prevents overwriting of built in props.
			if ( signal[ namespace ] ) return;
			
			signal[ namespace ] = {
				add: function( listener, target )
				{
					_ns = namespace;
					signal.add( listener, target );
					_ns = null;
				},
				addToTop: function( listener, target )
				{
					_ns = namespace;
					signal.addToTop( listener, target );
					_ns = null;
				},
				remove: function( listener )
				{
					if ( !listener ) return;
					_ns = namespace;
					signal.remove( listener );
					_ns = null;
				},
				removeAll: function()
				{
					if ( signal.first === signal.last ) return;
					
					var node = signal.first;
					
					while ( node = node.next )
						if ( node.ns === namespace )
							cutNode.call( signal, node );
					
					if ( signal.first === signal.last )
						signal.first.next = null;
				},
				once: function( listener, target )
				{
					_ns = namespace;
					signal.once( listener, target );
					_ns = null;
				}
			};
		},
		remove: function( namespace ) {
			delete signal[ namespace ];
		}
	};
}

function cutNode( node )
{
	node.prev.next = node.next;
	if ( node.next )
		node.next.prev = node.prev;
	if ( this.last === node )
		this.last = node.prev;
}

function callListener( signal, node, args )
{
	try {
		var val = node.listener.apply(
			node.target || signal.target, args
		);
		if ( signal.eachReturn ) {
			signal.eachReturn( val, args );
		}
	}
	catch ( e ) {
		// Firefox is supporessing this for some reason, so we'll 
		// manually report the error, until I figure out why.
		if ( isFirefox && console )
			console.error( e );
		if ( signal.eachError )
			signal.eachError( e );
		throw e;
	}
}

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
		this.last.ns = _ns;
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
		slot.ns = _ns;
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
			listener = undefined;
			that = undefined;
		}
		this.add( oneTime, target );
	},
	
	/**
	 * Remove a listener for this Signal.
	 * @param listener The function to be removed from the signal.
	 */
	remove: function( listener )
	{
		if ( this.first === this.last ) return;
		
		var node = this.first;
		
		while ( node = node.next ) {
			if ( node.listener === listener &&
					node.ns === _ns ) {
				cutNode.call( this, node );
				break;
			}
		}
		
		if ( this.first === this.last )
			this.first.next = null;
	},
	
	/**
	 * Remove all listeners from this Signal.
	 */
	removeAll: function()
	{
		this.first.next = null;
		this.first.prev = null;
		this.last = this.first;
	},
	
	/**
	 * Dispatches an event. Uses Dean Edwards DOM dispatching to avoid 
	 * blocking dispatch on error, and to avoid suppressing those errors.
	 * @link http://dean.edwards.name/weblog/2009/03/callbacks-vs-events/
	 */
	dispatch: function()
	{
		if ( this.first === this.last ) return;
		
		var args = Array.prototype.slice.call(arguments),
			sigEvtName = "SignalLiteEvent" + (++sig_index),
			d = document;
		
		function getSignalClosure( signal, node ) {
			return function closure() {
				d.removeEventListener( sigEvtName, closure, false );
				callListener( signal, node, args );
			};
		}
		
		// Building this dispatch list essentially copies the dispatch list, so 
		// add/removes during dispatch won't have any effect. BONUS~!
		var node = this.first;
		while ( node = node.next ) {
			d.addEventListener( sigEvtName,
				getSignalClosure( this, node ), false
			);
		}
		
		var se = d.createEvent( "UIEvents" );
		se.initEvent( sigEvtName, false, false );
		d.dispatchEvent( se );
	}
};

// IE 8 and lower
if ( !document.addEventListener )
{
	var elm = document.documentElement;
	
	SignalLite.prototype.dispatch = function()
	{
		if ( this.first === this.last ) return;
		
		var args = Array.prototype.slice.call(arguments);
		var sigEvtName = "SignalLiteEvent" + (++sig_index);
		
		elm[ sigEvtName ] = 0;
		
		function getSignalClosure( signal, node ) {
			return function( event )
			{
				if (event.propertyName === sigEvtName) {
					elm.detachEvent( "onpropertychange",
						 // using named inline function ref didn't work here...
						arguments.callee, false
					);
					callListener( signal, node, args );
				}
			};
		}
		
		// NOTE: IE dispatches in reverse order, so we need to
		// attach the events backwards. Actually, this didn't
		// always work (especially from a local disk). We'll
		// do the slower individual dispatch method, to keep
		// things dispatching in the correct order.
		var node = this.first;
		while ( node = node.next ) {
			elm.attachEvent( "onpropertychange",
				getSignalClosure( this, node ), false
			);
			// triggers the property change event
			elm[ sigEvtName ]++;
		}
		
		elm[ sigEvtName ] = undefined;
	};
}

// This has to be assigned here, rather than inline because of bugs in IE7/IE8
window.SignalLite = SignalLite;

})();
