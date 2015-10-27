/* (c) 2012 Kevin Newman
license MIT
www.unfocus.com */
(function (exports) { "use strict";

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
 * @param target The value of this in listeners when broadcasting.
 * @param eachReturn A callback to handle the return value of each listener.
 * @author Kevin Newman
 */
function SignalLite( target, eachReturn )
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
   * The value of this in listeners when broadcasting.
   */
  this.target = target;

  /**
   * A callback to handle the return value of each listener.
   */
  this.eachReturn = eachReturn;

  /**
   * A simple flag to say if we are broadcasting. Used by stopDispatch.
   * @private
   */
  this.broadcasting = false;
}

function cutNode( node )
{
  node.prev.next = node.next;
  if ( node.next )
    node.next.prev = node.prev;
  if ( this.last === node )
    this.last = node.prev;
};

SignalLite.prototype = {
  /**
   * Add a listener for this Signal.
   * @param listener The function to be called when the signal fires.
   * @param target The value of this in listeners when broadcasting only this listener.
   */
  add: function( listener, target )
  {
    if ( this.has( listener ) ) return;
    this.last.next = new SlotLite( listener, target );
    this.last.next.prev = this.last;
    this.last = this.last.next;
    return this.target;
  },

  /**
   * Add a listener for this Signal in the first position.
   * Pushes the first item to the second position. If the listener
   * is already registered, it'll move it to the top.
   * @param listener The function to be called when the signal fires.
   * @param target The value of this in listeners when broadcasting only this listener.
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
    return this.target;
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
   * @param target The value of this in listeners when broadcasting only this listener.
   */
  once: function( listener, target )
  {
    var that = this;
    function oneTime() {
      that.remove( oneTime );
      listener.apply( this, arguments );
    }
    return this.add( oneTime, target );
  },

  /**
   * Remove a listener for this Signal.
   * @param listener The function to be removed from the signal.
   */
  remove: function( listener )
  {
    if (this.first === this.last ) return;

    var node = this.first;

    while ( node = node.next ) {
      if ( node.listener === listener ) {
        cutNode.call( this, node );
        break;
      }
    }

    if ( this.first === this.last )
      this.first.next = null;

    return this.target;
  },

  /**
   * Remove all listeners from this Signal.
   */
  removeAll: function()
  {
    this.first.next = null;
    this.first.prev = null;
    this.last = this.first;

    return this.target;
  },

  /**
   * Broadcast the signal. Allocates no memory during broadcast, and is lightening fast.
   */
  broadcast: function()
  {
    if ( this.first === this.last ) return;

    this.broadcasting = true;

    var node = this.first;

    while ( (node = node.next) && this.broadcasting )
    {
      var val = node.listener.apply(
        node.target || this.target, arguments
      );
      if ( this.eachReturn )
        this.eachReturn( val, arguments );
    }

    this.broadcasting = false;

    return this.target;
  },

  stopBroadcast: function() {
    this.broadcasting = false;
    return this.target;
  }
};

var _ns = null;

/**
 * A more fully featured Signal. Provides additional functionality with namespaces and priority adds.
 * @param target The value of this in listeners when broadcasting.
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

exports.SignalLite = SignalLite;
exports.SlotLite = SlotLite;
exports.Signal = Signal;

})(typeof exports !== 'undefined' ? exports : this);
