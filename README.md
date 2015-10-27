SignalsLite.js
==============

SignalsLite for JavaScript is an implementation of the Signals event pattern, modeled after AS3 Signals. In the signals paradigm, events are addressed as named properties rather than strings, and each event is an instance of the SignalLite object. The idea behind Signals was to create a dispatch method which required less boilerplate to implement and use, and to have a more formal contract between listener and dispatcher. Here's a quick example:

```JavaScript
// using SignalLite to expose event
var myInterface = {
	clicked: new SignalLite(),
	loaded: new SiganlLite()
};

// subscribing to Signals
myInterface.clicked.add( function( obj ) {
	// respond to the click.
} );

// dispatching with arbitrary object
myInterface.clicked.broadcast( obj );
```

In JavaScript, the property based model (obj.clicked, vs. strings based model addEventListener( "clicked" ) ) has additional benefit over string based models, because when you type something wrong (obj.laoded.clicked) JavaScript will throw up an error, rather than silently adding an event listener to an event that will never fire.

The lightweight signals paradigm doesn't require an event object like the DOM model. No standard object is passed to the listener, unless you want it to. Instead, all arguments passed to the broadcast method will be passed on to the listeners. This is nice because you can actually pass whatever you want to the listeners, without having to create a custom Event object, or code up any boilerplate. Just pass the values or references your listeners will need, if any.

SignalDispatcher provides a safe dispatching model. If there is a JavaScript error thrown in a listener, it will not block the remaining signals. Care was taken to make sure errors are not supressed. Note: There is an error in Firefox where DOM events do suppress errors - there's a workaround in SignalsLite.js to report the error to the JavaScript console, but these errors will not trigger window.onerror. To compensate, there is an eachError function you can set to catch these errors.

Installation
------------

Use Bower to install (Currently only SignalsLite):

`bower install signals-lite`

or npm (Currently only SignalsLite):

`npm install signals-lite`

API Quick Reference
-------------------

These are the public methods and properties provided by a SignalLite instance:

```Javascript
SignalLite( target, eachReturn ) = {
	add           ( listener, target )
	addToTop      ( listener, target )
	once          ( listener, target )
	remove        ( listener )
	removeAll     ()
	getLength     () // returns the number of listeners
	broadcast     ()
	stopBroadcast ()
	eachReturn    property function
}
// all of SignalLite, plus
Signal( target, eachReturn ) = {
	namespace.add     ( "{yourNamespace}" )
	namespace.remove  ( "{yourNamespace}" )
	{yourNamespace} = {
		add       ( listener, target )
		addToTop  ( listener, target )
		once      ( listener, target )
		remove    ( listener )
		removeAll ()
	}
	priority( n ).add      ( listener, target )
	priority( n ).addToTop ( listener, target )
	priority( n ).once     ( listener, target )
}
// all of Signal and SignalLite with safe dispatch method
SignalDispatcher( target, eachReturn, eachError ) = {
	dispatch     ( ... rest )
	stopDispatch ()
	eachError    property function
}
```

There are 3 ways to add a listener to a Signal, add, once, and addToTop.
 - add adds the listener to the end of the list.
 - once adds the listener to the end of the list, and will only fire one time, then remove itself.
 - addToTop adds the listener to the beginning of the list.

All add methods can take a second argument which will set the `this` variable in the listener. This is useful if you are using a property of another object as a listener, and would like the `this` variable to resolve correctly.

All add and remove methods return the target specified in the constructor, to facilitate chainability.

Namespaces
----------

Namespace support is modeled after jQuery event namespacing. This is great because it allows you to remove listeners even when you don't have access to a reference of the listener function, as in cases where an anonymous function was added, or the listener was added in another scope or closure. In SignalsLite.js, namespaces are property based, just like signals themselves. To create a namespace, register a namespace using the namespace property methods:

```Javascript
var signaled = new Signal();

// add the namespace
signaled.namespace.add( "module" );

// use the namespace
signaled.module.add( function() {
	// do something
} );

// This contrived closure makes referencing the listener from the outside impossible
(function() {
	var private = "some value";
	signaled.module.add( function() {
		// do something
	} );
} )();

// now we can remove the anonymous function and the scope protected listener
signaled.module.removeAll();

// Yay!
```

SignalsLite.js is unit tested.

MIT License.
