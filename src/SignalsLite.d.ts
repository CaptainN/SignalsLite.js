interface SignalLite {
	constructor( target?: any, eachReturn?: ( any? ) => any );
	add( listener: ( ...args: any[] ) => any, target?: any ) : void;
	addToTop( listener: () => any, target?: any ) : void;
	once( listener: () => any, target?: any ) : void;
	remove( listener: () => any ) : void;
	removeAll() : void;
	getLength() : number;
	trigger( ...args: any[] ) : void;
	stopDispatch() : void;
	eachReturn: ( ...args: any[] ) => any;
}
interface SignalNamespace {
	add( listener: ( ...args: any[] ) => any, target?: any ): void;
	addToTop( listener: ( ...args: any[] ) => any, target?: any ): void;
	once( listener: (...args: any[] ) => any, target?: any ): void;
	remove( listener: (...args: any[] ) => any ): void;
	removeAll():void;
}
interface SignalNamespaceMgr {
	add( name: string );
	remove( name: string );
}
interface SignalPriority {
	add( listener: (...args: any[] ) => any, target?: any );
	addToTop( listener: (...args: any[] ) => any, target?: any );
	once( listener: (...args: any[] ) => any, target?: any );
}
// :TODO: ns.add adds a property to the signal, figure out how to allow in TS.
interface Signal extends SignalLite {
	ns: SignalNamespaceMgr;
	ns( name: string ): SignalNamespace;
	namespace: SignalNamespaceMgr;
	namespace( name: string ): SignalNamespace;
	priority( priority: number ): SignalPriority;
}
interface SignalDispatcher extends Signal {
	constructor( target?: any, eachReturn?: ( any? ) => any, eachError?: ( any? ) => any );
	dispatch( ...args: any[] ) : void;
	eachError: ( ...args: any[] ) => any;
}
