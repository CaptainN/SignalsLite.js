declare class SignalLite {
	constructor( target?: any, eachReturn?: ( ...args: any[] ) => any );
	add( listener: ( ...args: any[] ) => any, target?: any ) : void;
	addToTop( listener: ( ...args: any[] ) => any, target?: any ) : void;
	once( listener: ( ...args: any[] ) => any, target?: any ) : void;
	remove( listener: ( ...args: any[] ) => any ) : void;
	removeAll() : void;
	getLength() : number;
	trigger( ...args: any[] ) : void;
	stopDispatch() : void;
	eachReturn: ( ...args: any[] ) => any;
}
declare class SignalNamespace {
	add( listener: ( ...args: any[] ) => any, target?: any ): void;
	addToTop( listener: ( ...args: any[] ) => any, target?: any ): void;
	once( listener: (...args: any[] ) => any, target?: any ): void;
	remove( listener: (...args: any[] ) => any ): void;
	removeAll():void;
}
declare class SignalNamespaceMgr {
	add( name: string );
	remove( name: string );
}
declare class SignalPriority {
	add( listener: (...args: any[] ) => any, target?: any );
	addToTop( listener: (...args: any[] ) => any, target?: any );
	once( listener: (...args: any[] ) => any, target?: any );
}
// :TODO: ns has .add and .remove nodes, figure out how to specify that in TS.
// :TODO: ns.add adds a property to the signal, figure out how to allow in TS.
declare class Signal extends SignalLite {
	constructor( target?: any, eachReturn?: ( ...args: any[] ) => any );
	//ns: SignalNamespaceMgr;
	ns( name: string ): SignalNamespace;
	//namespace: SignalNamespaceMgr;
	namespace( name: string ): SignalNamespace;
	priority( priority: number ): SignalPriority;
}
declare class SignalDispatcher extends Signal {
	constructor( target?: any, eachReturn?: ( any? ) => any, eachError?: ( any? ) => any );
	dispatch( ...args: any[] ) : void;
	eachError: ( ...args: any[] ) => any;
}
