window.__ModuleLoader__.load({
  id: "@deepseek-harness-desktop/dsh-window-drag-bridge",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");
    const BRIDGE_PREFIX = "[desktop-window-drag-bridge]";
    const DRAG_MESSAGE_TYPE = "deepseek-harness-desktop:start-window-drag";
    const TOGGLE_MAXIMIZE_MESSAGE_TYPE = "deepseek-harness-desktop:toggle-window-maximize";
    const DIAGNOSTIC_MESSAGE_TYPE = "deepseek-harness-desktop:drag-bridge-diagnostic";

    function report(stage, detail) {
      const message = `${BRIDGE_PREFIX} ${stage}: ${detail}`;
      console.info(message);
      window.parent.postMessage({ type: DIAGNOSTIC_MESSAGE_TYPE, stage, detail }, "*");
    }

    function isInteractiveTarget(event) {
      const target = event.target;
      if (!(target instanceof Element)) return false;
      return target.closest(
        "button, a, input, textarea, select, option, [role='button'], [role='menuitem'], [contenteditable='true'], [data-no-window-drag]",
      ) !== null;
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
          report("drag-requested", "posting native drag request");
          window.parent.postMessage({ type: DRAG_MESSAGE_TYPE }, "*");
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

    report("module-loaded", "client bundle factory executed");
    exports.inject = ["slots"];
    exports.apply = (ctx) => {
      report("plugin-apply", "requesting conversation.session.header slot");
      ctx.inject(["slots"], (scope) => {
        report("slots-ready", "registering Header bridge component");
        scope.slots.inject("conversation.session.header", () =>
          scope.slots.register(
            {
              name: "conversation.session.header",
              id: "desktop-window-drag-bridge",
              order: -1000,
            },
            HeaderDragBridge,
          ),
        );
      });
    };
    return module.exports;
  },
});
