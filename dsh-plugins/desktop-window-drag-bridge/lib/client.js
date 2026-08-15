window.__ModuleLoader__.load({
  id: "@deepseek-harness-desktop/dsh-window-drag-bridge",
  factory: (require) => {
    const React = require("react");
    const DRAG_MESSAGE_TYPE = "deepseek-harness-desktop:start-window-drag";
    const TOGGLE_MAXIMIZE_MESSAGE_TYPE = "deepseek-harness-desktop:toggle-window-maximize";

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
        if (!header) return undefined;

        const handlePointerDown = (event) => {
          if (event.button !== 0 || event.defaultPrevented || isInteractiveTarget(event)) return;
          window.parent.postMessage({ type: DRAG_MESSAGE_TYPE }, "*");
        };
        const handleDoubleClick = (event) => {
          if (event.defaultPrevented || isInteractiveTarget(event)) return;
          window.parent.postMessage({ type: TOGGLE_MAXIMIZE_MESSAGE_TYPE }, "*");
        };

        header.addEventListener("pointerdown", handlePointerDown, true);
        header.addEventListener("dblclick", handleDoubleClick, true);
        return () => {
          header.removeEventListener("pointerdown", handlePointerDown, true);
          header.removeEventListener("dblclick", handleDoubleClick, true);
        };
      }, []);

      return React.createElement("span", { ref: markerRef, style: { display: "none" } });
    }

    exports.inject = ["slots"];
    exports.apply = (ctx) => {
      ctx.inject(["slots"], (scope) => {
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
  },
});
