(function( undefined ) { "use strict";

var sig_index = 0,
	_ns = null,
	isFirefox = navigator.userAgent.indexOf( "compatible" ) < 0 &&
		/Mozilla(.*)rv:(.*)Gecko/.test( navigator.userAgent );

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
	 * The listeners
	 * @private
	 */
	this._slots = [];
	
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
	
	/**
	 * A simple flag to say if we are dispatching. Used by stopDispatch.
	 * @private
	 */
	this.dispatching = false;
	
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
					_ns = namespace;
					signal.remove( listener );
					_ns = null;
				},
				removeAll: function()
				{
					for (var i = signal._slots.length - 1, slot; slot = signal._slots[ i ]; i-- )
						if ( slot.ns === namespace )
							signal._slots.splice( i, 1 );
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

function callListener( signal, node, args )
{
	try {
		var val = node.listener.apply(
			node.target || signal.target, args
		);
		if ( signal.eachReturn )
			signal.eachReturn( val, args );
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
		if ( this.has( listener ) )
			return;
		
		this._slots.push( {
			listener: listener,
			target: target,
			ns: _ns
		} );
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
		this._slots.unshift( {
			listener: listener,
			target: target,
			ns: _ns
		} );
	},
	
	/**
	 * Checks if the Signal contains a specific listener.
	 * @param listener The listener to check for.
	 * @return Whether or not the listener is in the queue for this signal.
	 */
	has: function( listener )
	{
		for (var i = 0, slot = null; slot = this._slots[ i ]; i++)
			if (slot.listener === listener )
				return true;
		return false;
	},
	
	/**
	 * Gets the number of listeners.
	 */
	getLength: function()
	{
		return this._slots.length;
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
		for (var i = 0, slot = null; slot = this._slots[ i ]; i++) {
			if (slot.listener === listener && slot.ns === _ns ) {
				this._slots.splice( i, 1 );
				return;
			}
		}
	},
	
	/**
	 * Remove all listeners from this Signal.
	 */
	removeAll: function()
	{
		this._slots = [];
	},
	
	/**
	 * jQuery style trigger - fast, manual error handling recommended.
	 * SignalLite.trigger does not use safe dispatching, but
	 * is lightening fast compared with SignalLite.dispatch. Use with caution.
	 */
	trigger: function()
	{
		this.dispatching = true;
		
		var args = Array.prototype.slice.call(arguments)
		
		for (var i = 0, slot = null; slot = this._slots[ i ]; i++)
		{
			slot.listener.apply(
				slot.target || this.target, args
			);
			if ( this.eachReturn )
				this.eachReturn( val, args );
		}
		
		this.dispatching = false;
	},
	
	/**
	 * Dispatches an event. 
	 * SignalLite.dispatch is a safe dispatcher, which means errors in
	 * listeners will not fail silently, and will not block the next
	 * listener.
	 * @link http://dean.edwards.name/weblog/2009/03/callbacks-vs-events/
	 */
	dispatch: function()
	{
		if ( this._slots.length < 1 ) return;
		
		var args = Array.prototype.slice.call(arguments),
			sigEvtName = "SignalLiteEvent" + (++sig_index),
			d = document;
		
		function getSignalClosure( signal, slot ) {
			return function closure() {
				d.removeEventListener( sigEvtName, closure, false );
				if ( signal.dispatching )
					callListener( signal, slot, args );
			};
		}
		
		// Building this dispatch list essentially copies the dispatch list, so 
		// add/removes during dispatch won't have any effect. BONUS~!
		for (var i = 0, slot = null; slot = this._slots[ i ]; i++)
		{
			d.addEventListener( sigEvtName,
				getSignalClosure( this, slot ), false
			);
		}
		
		this.dispatching = true;
		
		var se = d.createEvent( "UIEvents" );
		se.initEvent( sigEvtName, false, false );
		d.dispatchEvent( se );
	},
	stopDispatch: function() {
		this.dispatching = false;
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
		
		function getSignalClosure( signal, slot ) {
			return function( event )
			{
				if (event.propertyName === sigEvtName) {
					elm.detachEvent( "onpropertychange",
						 // using named inline function ref didn't work here...
						arguments.callee, false
					);
					if ( signal.dispatching )
						callListener( signal, slot, args );
				}
			};
		}
		
		this.dispatching = true;
		
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
		
		try {
			delete elm[ sigEvtName ];
		}
		catch( e ) {
			elm[ sigEvtName ] = null;
		}
	};
}

// This has to be assigned here, rather than inline because of bugs in IE7/IE8
window.SignalLite = SignalLite;

})();
