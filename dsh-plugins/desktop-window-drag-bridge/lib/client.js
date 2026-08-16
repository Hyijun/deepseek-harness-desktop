window.__ModuleLoader__.load({
  id: "@deepseek-harness-desktop/dsh-window-drag-bridge",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");
    const BRIDGE_PREFIX = "[desktop-window-drag-bridge]";
    const DRAG_MESSAGE_TYPE = "deepseek-harness-desktop:start-window-drag";
    const MINIMIZE_MESSAGE_TYPE = "deepseek-harness-desktop:minimize-window";
    const TOGGLE_MAXIMIZE_MESSAGE_TYPE = "deepseek-harness-desktop:toggle-window-maximize";
    const HIDE_WINDOW_MESSAGE_TYPE = "deepseek-harness-desktop:hide-window";
    const NATIVE_NOTIFICATION_MESSAGE_TYPE = "deepseek-harness-desktop:show-native-notification";
    const TOGGLE_SIDEBAR_MESSAGE_TYPE = "deepseek-harness-desktop:toggle-sidebar";
    const DIAGNOSTIC_MESSAGE_TYPE = "deepseek-harness-desktop:drag-bridge-diagnostic";

    function report(stage, detail) {
      const message = `${BRIDGE_PREFIX} ${stage}: ${detail}`;
      console.info(message);
      window.parent.postMessage({ type: DIAGNOSTIC_MESSAGE_TYPE, stage, detail }, "*");
    }

    function installEmbeddedNotificationBridge() {
      if (window.parent === window || typeof window.Notification === "undefined") return;

      class EmbeddedNotification {
        static permission = "granted";
        static requestPermission = () => Promise.resolve("granted");

        constructor(title, options = {}) {
          this.title = String(title);
          this.body = typeof options.body === "string" ? options.body : "";
          this.onclick = null;
          window.parent.postMessage(
            {
              type: NATIVE_NOTIFICATION_MESSAGE_TYPE,
              title: this.title,
              body: this.body,
            },
            "*",
          );
        }

        close() {}
      }

      try {
        Object.defineProperty(window, "Notification", {
          configurable: true,
          value: EmbeddedNotification,
          writable: true,
        });
        console.info(`${BRIDGE_PREFIX} embedded Notification bridge installed`);
      } catch (error) {
        console.error(`${BRIDGE_PREFIX} failed to install embedded Notification bridge`, error);
      }
    }

    function isInteractiveTarget(event) {
      const target = event.target;
      if (!(target instanceof Element)) return false;
      return target.closest(
        "button, a, input, textarea, select, option, [role='button'], [role='menuitem'], [contenteditable='true'], [data-no-window-drag]",
      ) !== null;
    }

    const controlStyle = {
      alignItems: "center",
      background: "transparent",
      border: 0,
      borderRadius: 4,
      color: "inherit",
      cursor: "pointer",
      display: "inline-flex",
      height: 28,
      justifyContent: "center",
      padding: 0,
      width: 28,
    };

    function HeaderControlIcon({ type }) {
      const props = {
        "aria-hidden": true,
        fill: "none",
        height: 15,
        stroke: "currentColor",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.8,
        viewBox: "0 0 24 24",
        width: 15,
      };
      if (type === "minimize") {
        return React.createElement("svg", props, React.createElement("path", { d: "M5 12h14" }));
      }
      if (type === "maximize") {
        return React.createElement("svg", props, React.createElement("rect", { height: 12, rx: 1, width: 12, x: 6, y: 6 }));
      }
      if (type === "close") {
        return React.createElement(
          "svg",
          props,
          React.createElement("path", { d: "M6 6l12 12" }),
          React.createElement("path", { d: "M18 6 6 18" }),
        );
      }
      return React.createElement(
        "svg",
        props,
        React.createElement("circle", { cx: 12, cy: 12, r: 3 }),
        React.createElement("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06A1.7 1.7 0 0 0 15.76 18a1.7 1.7 0 0 0-1.04 1.56V20h-3v-.44A1.7 1.7 0 0 0 10.68 18a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7 14.36a1.7 1.7 0 0 0-1.56-1.04H5v-3h.44A1.7 1.7 0 0 0 7 9.28a1.7 1.7 0 0 0-.34-1.88L6.6 7.34l2.1-2.1.06.06A1.7 1.7 0 0 0 10.64 5a1.7 1.7 0 0 0 1.04-1.56V3h3v.44A1.7 1.7 0 0 0 15.72 5a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06A1.7 1.7 0 0 0 19.4 8.64 1.7 1.7 0 0 0 21 9.68H21.4v3H21a1.7 1.7 0 0 0-1.6 1.04Z" }),
      );
    }

    function HeaderWindowControls() {
      const send = (type) => (event) => {
        event.stopPropagation();
        window.parent.postMessage({ type }, "*");
      };
      return React.createElement(
        "div",
        { "data-no-window-drag": "", style: { alignItems: "center", display: "inline-flex", gap: 2 } },
        React.createElement(
          "button",
          { "aria-label": "Open interface settings", "data-no-window-drag": "", onClick: send(TOGGLE_SIDEBAR_MESSAGE_TYPE), style: controlStyle, title: "Open interface settings", type: "button" },
          React.createElement(HeaderControlIcon, { type: "settings" }),
        ),
        React.createElement(
          "button",
          { "aria-label": "Minimize window", "data-no-window-drag": "", onClick: send(MINIMIZE_MESSAGE_TYPE), style: controlStyle, title: "Minimize window", type: "button" },
          React.createElement(HeaderControlIcon, { type: "minimize" }),
        ),
        React.createElement(
          "button",
          { "aria-label": "Maximize or restore window", "data-no-window-drag": "", onClick: send(TOGGLE_MAXIMIZE_MESSAGE_TYPE), style: controlStyle, title: "Maximize or restore window", type: "button" },
          React.createElement(HeaderControlIcon, { type: "maximize" }),
        ),
        React.createElement(
          "button",
          { "aria-label": "Hide window", "data-no-window-drag": "", onClick: send(HIDE_WINDOW_MESSAGE_TYPE), style: controlStyle, title: "Hide window", type: "button" },
          React.createElement(HeaderControlIcon, { type: "close" }),
        ),
      );
    }

    function HeaderDragBridge() {
      const markerRef = React.useRef(null);

      React.useEffect(() => {
        const header = markerRef.current?.closest("header");
        if (!header) {
          report("header-missing", "slot content mounted without a header ancestor");
          return undefined;
        }

        report("header-ready", "attached pointerdown and dblclick listeners");
        const handlePointerDown = (event) => {
          if (event.button !== 0) {
            report("pointerdown-ignored", `non-primary button ${event.button}`);
            return;
          }
          if (event.defaultPrevented) {
            report("pointerdown-ignored", "event was default-prevented");
            return;
          }
          if (isInteractiveTarget(event)) {
            report("pointerdown-ignored", "interactive target");
            return;
          }

          const startX = event.clientX;
          const startY = event.clientY;
          const pointerId = event.pointerId;
          const cleanup = () => {
            header.removeEventListener("pointermove", handlePointerMove, true);
            header.removeEventListener("pointerup", cleanup, true);
            header.removeEventListener("pointercancel", cleanup, true);
          };
          const handlePointerMove = (moveEvent) => {
            if (moveEvent.pointerId !== pointerId) return;
            if ((moveEvent.buttons & 1) === 0) {
              cleanup();
              return;
            }
            if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
            cleanup();
            report("drag-requested", "pointer moved after primary press; posting native drag request");
            window.parent.postMessage({ type: DRAG_MESSAGE_TYPE }, "*");
          };

          report("drag-armed", "waiting for pointer movement before native drag request");
          header.addEventListener("pointermove", handlePointerMove, true);
          header.addEventListener("pointerup", cleanup, true);
          header.addEventListener("pointercancel", cleanup, true);
        };
        const handleDoubleClick = (event) => {
          if (event.defaultPrevented) {
            report("dblclick-ignored", "event was default-prevented");
            return;
          }
          if (isInteractiveTarget(event)) {
            report("dblclick-ignored", "interactive target");
            return;
          }
          report("maximize-requested", "posting native maximize toggle request");
          window.parent.postMessage({ type: TOGGLE_MAXIMIZE_MESSAGE_TYPE }, "*");
        };

        header.addEventListener("pointerdown", handlePointerDown, true);
        header.addEventListener("dblclick", handleDoubleClick, true);
        return () => {
          report("header-cleanup", "removing pointer listeners");
          header.removeEventListener("pointerdown", handlePointerDown, true);
          header.removeEventListener("dblclick", handleDoubleClick, true);
        };
      }, []);

      return React.createElement("span", { ref: markerRef, style: { display: "none" } });
    }

    installEmbeddedNotificationBridge();
    report("module-loaded", "client bundle factory executed");
    exports.inject = ["slots"];
    exports.apply = (ctx) => {
      report("plugin-apply", "requesting conversation.session.header.actions slot");
      ctx.inject(["slots"], (scope) => {
        report("slots-ready", "registering Header bridge component");
        scope.slots.inject("conversation.session.header.actions", () =>
          scope.slots.register(
            {
              name: "conversation.session.header.actions",
              id: "desktop-window-drag-bridge",
              order: -1000,
            },
            HeaderDragBridge,
          ),
        );
        scope.slots.inject("conversation.session.header.utilities", () =>
          scope.slots.register(
            {
              name: "conversation.session.header.utilities",
              id: "desktop-window-controls",
              order: 1000,
            },
            HeaderWindowControls,
          ),
        );
      });
    };
    return module.exports;
  },
});
