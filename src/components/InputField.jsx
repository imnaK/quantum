import { classNames } from "@utils";
import { QUANTUM_CLASS } from "@utils/constants";

export default BdApi.React.forwardRef((props, ref) => {
  const inputRef = BdApi.React.useRef();

  BdApi.React.useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current.value,
  }));

  const handleKeyDown = (event) => {
    if (event.key === "Enter") props.handleConfirm();
  };

  return (
    <input
      type={props.type || "text"}
      className={classNames(QUANTUM_CLASS, "inputField")}
      placeholder={props.placeholder || ""}
      onKeyDown={handleKeyDown}
      ref={inputRef}
    />
  );
});
