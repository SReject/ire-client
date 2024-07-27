var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var ire_client_exports = {};
__export(ire_client_exports, {
  default: () => IREClient
});
module.exports = __toCommonJS(ire_client_exports);
class IREClient {
  $events = /* @__PURE__ */ new Map();
  $methods = /* @__PURE__ */ new Map();
  $pending = /* @__PURE__ */ new Map();
  $pendingId = 0;
  $processing = /* @__PURE__ */ new Set();
  $onMessage;
  $transport;
  constructor(transport) {
    if (transport) {
      this.hook(transport);
    }
  }
  /** Registers a method that can be invoked by the remote-client
   *
   * @param name The method name that can be invoked
   * @param handler Callback to handle the invocation
   */
  register(name, handler) {
    if (typeof name !== "string") {
      throw new Error("method name must be a string");
    }
    if (name === "") {
      throw new Error("method name must not be an empty string");
    }
    if (this.$methods.has(name)) {
      throw new Error("method already registered");
    }
    if (typeof handler !== "function") {
      throw new Error("method handler must be a function");
    }
    this.$methods.set(name, handler);
    return this;
  }
  /** Unregisters a method from being invocable by the remote-client
   *
   * @param name The method name that can be invoked
   * @param handler Callback to handle the invocation
   */
  unregister(name, handler) {
    if (typeof name !== "string") {
      throw new Error("method name must be a string");
    }
    if (name === "") {
      throw new Error("method name must not be an empty string");
    }
    if (typeof handler !== "function") {
      throw new Error("method handler must be a function");
    }
    if (this.$methods.has(name) && this.$methods.get(name) === handler) {
      this.$methods.delete(name);
    }
    return this;
  }
  /** Adds an IRE event listener
   *
   * @param event The event to listen for
   * @param handler The callback to handle the event
   * @param once When true a one-time event handler is registered
   */
  on(event, handler, once = false) {
    if (typeof event !== "string") {
      throw new Error("event name must be a string");
    }
    if (typeof handler !== "function") {
      throw new Error("event handler must be a function");
    }
    if (once != null && typeof once !== "boolean") {
      throw new Error("once must be boolean when specified");
    }
    if (!this.$events.has(event)) {
      this.$events.set(event, []);
    }
    this.$events.get(event).push({
      handler,
      once: once === true
    });
    return this;
  }
  /** Adds a one-time IRE event listener
   *
   * @param event The event to listen to
   * @param handler The callback to handle the event
   */
  once(event, handler) {
    return this.on(event, handler, true);
  }
  /** Removes a registered event listener
   *
   * @param event The event to listen for
   * @param handler The callback to handle the event
   * @param once When true a one-time event handler is removed
   * @returns
   */
  off(event, handler, once = false) {
    if (typeof event !== "string") {
      throw new Error("event name must be a string");
    }
    if (event === "") {
      throw new Error("event name must not be an empty string");
    }
    if (typeof handler !== "function") {
      throw new Error("event handler must be a function");
    }
    if (once != null && typeof once !== "boolean") {
      throw new Error("once must be boolean when specified");
    }
    if (this.$events.has(event)) {
      const list = this.$events.get(event);
      let idx = list.length;
      while (idx > -1) {
        const { handler: regHandler, once: regOnce } = list[idx];
        if (handler === regHandler && once === regOnce) {
          list.splice(idx, 1);
          break;
        }
        idx -= 1;
      }
    }
    return this;
  }
  /** Emits an event on the remote-client
   * @param event The event name to emit
   * @param data The data to emit with the event
  */
  emit(event, data) {
    if (this.$transport == null) {
      throw new Error("transport closed");
    }
    if (typeof event !== "string") {
      throw new Error("event name must be a string");
    }
    if (event === "") {
      throw new Error("event name must not be an empty string");
    }
    this.$transport.send(JSON.stringify({
      type: "event",
      id: 0,
      name: event,
      data
    }));
    return this;
  }
  /** Invokes a method on the remote-client and returns the result
   *
   * @param name The method name to invoke
   * @param args The args to pass to the invocation
   */
  invoke(name, ...args) {
    if (this.$transport == null) {
      throw new Error("transport closed");
    }
    if (typeof name !== "string") {
      throw new Error("method name must be a string");
    }
    if (name === "") {
      throw new Error("method name must not be an empty string");
    }
    return new Promise((resolve, reject) => {
      const id = ++this.$pendingId;
      this.$pending.set(id, { resolve, reject });
      this.$transport.send(JSON.stringify({
        type: "invoke",
        name,
        id,
        data: args
      }));
    });
  }
  /** Hooks the given transport
   * @param transport The transport to be hooked into
   */
  hook(transport) {
    if (this.$transport == null) {
      this.unhook();
    }
    this.$pendingId = 0;
    this.$transport = transport;
    this.$transport[transport.addEventListener ? "addEventListener" : "on"]("message", this.$onMessage = async (event) => {
      const data = event.data;
      if (typeof data !== "string" || data === "") {
        return;
      }
      let message;
      try {
        message = JSON.parse(data);
      } catch {
        return;
      }
      const { type, name, id, data: body } = message;
      if (typeof type !== "string" || type === "" || typeof name !== "string" || name === "" || id == null) {
        return;
      }
      if (type === "invoke") {
        if (body !== null && !Array.isArray(body)) {
          return;
        }
        if (!this.$methods.has(name)) {
          this.$transport.send(JSON.stringify({
            type: "response",
            name: "error",
            id,
            data: "UNKNOWN_METHOD"
          }));
          return;
        }
        const processing = { pending: true };
        this.$processing.add(processing);
        try {
          const result = await this.$methods.get(name)(...body || []);
          if (!processing.pending) {
            return;
          }
          this.$transport.send(JSON.stringify({
            type: "response",
            name: "success",
            id,
            data: result
          }));
        } catch (err) {
          if (!processing.pending) {
            return;
          }
          this.$transport.send(JSON.stringify({
            type: "response",
            name: "error",
            id,
            data: err.message
          }));
        }
        this.$processing.delete(processing);
      } else if (type === "response") {
        if (!this.$pending.has(id)) {
          return;
        }
        const pending = this.$pending.get(id);
        this.$pending.delete(id);
        if (name === "success") {
          pending.resolve(body);
        } else if (name === "error") {
          pending.reject(body);
        }
      } else if (type === "event") {
        if (id !== 0 || !this.$events.has(name)) {
          return;
        }
        const listeners = this.$events.get(name);
        let idx = 0;
        while (idx < listeners.length) {
          const { handler, once } = listeners[idx];
          if (once === false) {
            listeners.splice(idx, 1);
          } else {
            idx += 1;
          }
          handler(body);
        }
      }
    });
    return this;
  }
  /** Retrieves the currently hooked transport */
  get transport() {
    return this.$transport;
  }
  /** Unhooks from the transport */
  unhook() {
    for (const [key, value] of this.$pending) {
      value.reject(new Error("TRANSPORT_CLOSED"));
    }
    this.$pending = /* @__PURE__ */ new Map();
    this.$pendingId = 0;
    for (const processing of this.$processing) {
      processing.pending = false;
    }
    this.$processing = /* @__PURE__ */ new Set();
    if (this.$transport) {
      this.$transport[this.$transport.removeEventListener ? "removeEventListener" : "off"]("message", this.$onMessage);
      this.$transport = null;
      this.$onMessage = null;
    }
    return this;
  }
}
