(function (exports) { "use strict";

var sig_index = 0,
	d = document || {},
	isFirefox = navigator.userAgent.indexOf( "compatible" ) < 0 &&
		/Mozilla(.*)rv:(.*)Gecko/.test( navigator.userAgent );

/**
 * SignalDispatcher - has all the features of SignalLite
 * and Signal, plus safe dispatching.
 * @param target The value of this in listeners when dispatching.
 * @param eachReturn A callback to handle the return value of each listener.
 * @param eachError A callback to handle errors in each listener, when they occur.
 * This is especially useful for Firefox which suppresses erros inside listeners.
 */
function SignalDispatcher( target, eachReturn, eachError)
{
	Signal.call( this, target, eachReturn );
	
	/**
	 * A callback to handle errors in each listener, when they occur.
	 */
	this.eachError = eachError;
}
SignalDispatcher.prototype = new Signal();

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

if ( d.addEventListener )
{
	/**
	 * Dispatches an event. 
	 * SignalDispatcher.dispatch is a safe dispatcher, which means errors in
	 * listeners will not fail silently, and will not block the next
	 * listener.
	 * @link http://dean.edwards.name/weblog/2009/03/callbacks-vs-events/
	 */
	SignalDispatcher.prototype.dispatch = function()
	{
		if ( this.first === this.last ) return;
		
		var args = Array.prototype.slice.call(arguments),
			sigEvtName = "SignalLiteEvent" + (++sig_index),
			d = document;
		
		function getSignalClosure( signal, node ) {
			return function closure() {
				d.removeEventListener( sigEvtName, closure, false );
				if ( signal.dispatching )
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
		
		this.dispatching = true;
		
		var se = d.createEvent( "UIEvents" );
		se.initEvent( sigEvtName, false, false );
		d.dispatchEvent( se );
	};
}
// IE 8 and lower
else if ( d.attachEvent )
{
	var elm = d.documentElement;
	
	SignalDispatcher.prototype.dispatch = function()
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
					if ( signal.dispatching )
						callListener( signal, node, args );
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

window.SignalDispatcher = SignalDispatcher;
exports.SignalDispatcher = SignalDispatcher;

})(typeof exports !== 'undefined' ? exports : this);
