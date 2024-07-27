type EventHandler = (...args: unknown[]) => void;
type MethodHandler = (...args: unknown[]) => unknown;
type UpdateEventListener = (name: string, callback: (...args: unknown[]) => unknown) => unknown;
interface IRETransport {
    send: (data: unknown) => unknown;
    on?: UpdateEventListener;
    addEventListener?: UpdateEventListener;
    off?: UpdateEventListener;
    removeEventListener?: UpdateEventListener;
    [x: string | number | symbol]: unknown;
}
export default class IREClient {
    private $events;
    private $methods;
    private $pending;
    private $pendingId;
    private $processing;
    private $onMessage;
    private $transport;
    constructor(transport: IRETransport);
    /** Registers a method that can be invoked by the remote-client
     *
     * @param name The method name that can be invoked
     * @param handler Callback to handle the invocation
     */
    register(name: string, handler: MethodHandler): this;
    /** Unregisters a method from being invocable by the remote-client
     *
     * @param name The method name that can be invoked
     * @param handler Callback to handle the invocation
     */
    unregister(name: string, handler: MethodHandler): this;
    /** Adds an IRE event listener
     *
     * @param event The event to listen for
     * @param handler The callback to handle the event
     * @param once When true a one-time event handler is registered
     */
    on(event: string, handler: EventHandler, once?: boolean): this;
    /** Adds a one-time IRE event listener
     *
     * @param event The event to listen to
     * @param handler The callback to handle the event
     */
    once(event: string, handler: EventHandler): this;
    /** Removes a registered event listener
     *
     * @param event The event to listen for
     * @param handler The callback to handle the event
     * @param once When true a one-time event handler is removed
     * @returns
     */
    off(event: string, handler: EventHandler, once?: boolean): this;
    /** Emits an event on the remote-client
     * @param event The event name to emit
     * @param data The data to emit with the event
    */
    emit(event: string, data: unknown): this;
    /** Invokes a method on the remote-client and returns the result
     *
     * @param name The method name to invoke
     * @param args The args to pass to the invocation
     */
    invoke(name: string, ...args: unknown[]): Promise<unknown>;
    /** Hooks the given transport
     * @param transport The transport to be hooked into
     */
    hook(transport: IRETransport): this;
    /** Retrieves the currently hooked transport */
    get transport(): IRETransport;
    /** Unhooks from the transport */
    unhook(): this;
}
export {};
