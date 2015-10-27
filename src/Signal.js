(function (exports) { "use strict";

var _ns = null, cutNode = SignalLite._cutNode;

/**
 * A more fully featured Signal. Provides additional functionality with namespaces and priority adds.
 * @param target The value of this in listeners when dispatching.
 * @param eachReturn A callback to handle the return value of each listener.
 */
function Signal( target, eachReturn )
{
	SignalLite.apply( this, arguments );

	var signal = this;
	this.ns = this.namespace = function( ns ) {
		return this[ ns ] || this.ns.register( ns );
	};
	this.ns.register = function( namespace )
	{
		// prevents overwriting of built in props.
		if ( signal[ namespace ] ) return;

		signal[ namespace ] = {
			add: function( listener, target )
			{
				signal.add( listener, target );
				signal.last.ns = namespace;
				return signal.target;
			},
			addToTop: function( listener, target )
			{
				signal.addToTop( listener, target );
				signal.first.next.ns = namespace;
				return signal.target;
			},
			remove: function( listener )
			{
				if ( !listener || signal.first === signal.last ) return;

				var node = signal.first;

				while ( node = node.next ) {
					if ( node.listener === listener &&
							node.ns === namespace ) {
						cutNode.call( signal, node );
						break;
					}
				}

				if ( signal.first === signal.last )
					signal.first.next = null;

				return signal.target;
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

				return signal.target;
			},
			once: function( listener, target )
			{
				signal.once( listener, target );
				signal.last.ns = namespace;

				return signal.target;
			},
			priority: function( priority ) {
				_ns = namespace;
				var p = signal.priority( priority );
				_ns = null;
				return p;
			}
		};
		return signal[ namespace ];
	};
	this.ns.unregister = function( namespace ) {
		// :TODO: find a nice way to protect built in props
		delete signal[ namespace ];
	};

	// need to override the original add methods to set default priority of 0.
	var zeroP = signal.priority( 0 );
	signal.add = zeroP.add;
	signal.addToTop = zeroP.addToTop;
	signal.once = zeroP.once;
}
Signal.prototype = new SignalLite();

/**
 * priority - adds an item with a specific priority.
 * @param priority A number representing the priority position to add the listener.
 * @return An object with the add methods - add, addToTop and once.
 */
Signal.prototype.priority = function( priority )
{
	function priorityAdd( listener, target, compare )
	{
		// if the listener is already linked, remove it to reinsert.
		if ( signal.has( listener ) )
			signal.remove( listener );

		// if there are no listeners, insert at the beginning.
		if ( signal.first === signal.last ) {
			parent.add.call( signal, listener, target );
			signal.last.priority = priority;
			return;
		}

		var node = signal.first;
		while ( node = node.next )
		{
			if ( compare( node.priority, priority ) )
			{
				var slot = new SlotLite( listener, target );
				slot.priority = priority;
				slot.next = node;
				slot.prev = node.prev;
				node.prev.next = slot;
				node.prev = slot;
				slot.ns = pns;
				return;
			}
		}

		// If we got here, priority puts it at the end of the list.
		parent.add.call( signal, listener, target );
		signal.last.priority = priority;
	}
	var signal = this, pns = _ns, parent = SignalLite.prototype,
	props = {
		add: function( listener, target )
		{
			priorityAdd( listener, target,
				function( p1, p2 ) {
					return p1 > p2;
				}
			);
			return signal.target;
		},
		addToTop: function( listener, target )
		{
			priorityAdd( listener, target,
				function( p1, p2 ) {
					return p1 >= p2;
				}
			);
			return signal.target;
		},
		once: function( listener, target )
		{
			var add = signal.add;
			signal.add = props.add;
			parent.once.call( signal, listener, target );
			signal.add = add;
			return signal.target;
		}
	};
	return props;
};

exports.Signal = Signal;

})(typeof exports !== 'undefined' ? exports : this);
