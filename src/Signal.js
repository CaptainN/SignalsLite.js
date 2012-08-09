(function() { "use strict";

var _ns = null, cutNode = SignalLite._cutNode;

/**
 * A more fully featured Signal. Provides additional functionality with namespaces and priority adds.
 * @param target The value of this in listeners when dispatching.
 * @param eachReturn A callback to handle the return value of each listener.
 */
function Signal()
{
	SignalLite.apply( this, arguments );
	
	var signal = this;
	this.ns = this.namespace = function( ns ) {
		return this[ ns ] || this.ns.add( ns );
	};
	this.ns.add = function( namespace )
	{
		// prevents overwriting of built in props.
		if ( signal[ namespace ] ) return;
		
		signal[ namespace ] = {
			add: function( listener, target )
			{
				signal.add( listener, target );
				signal.last.ns = namespace;
			},
			addToTop: function( listener, target )
			{
				signal.addToTop( listener, target );
				signal.first.next.ns = namespace;
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
				signal.once( listener, target );
				signal.last.ns = namespace;
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
	this.ns.remove = function( namespace ) {
		delete signal[ namespace ];
	};
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
			signal.add( listener, target );
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
		signal.add( listener, target );
		signal.last.priority = priority;
	}
	var signal = this, pns = _ns;
	return {
		add: function( listener, target )
		{
			priorityAdd( listener, target,
				function( p1, p2 ) {
					return p1 > p2;
				}
			);
		},
		addToTop: function( listener, target )
		{
			priorityAdd( listener, target,
				function( p1, p2 ) {
					return p1 >= p2;
				}
			);
		},
		once: function( listener, target )
		{
			function oneTime() {
				signal.remove( oneTime );
				listener.apply( this, arguments );
			}
			this.add( oneTime, target );
		}
	};
};

window.Signal = Signal;

})();