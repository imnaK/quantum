export default BdApi.React.forwardRef((props, ref) => {
  const inputRef = BdApi.React.useRef();

  BdApi.React.useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current.value
  }));

  const handleKeyDown = (event) => {
    if (event.key === "Enter")
      props.handleConfirm();
  }

  return (
    <input
      type="password"
      placeholder={props.placeholder || ""}
      onKeyDown={handleKeyDown}
      ref={inputRef}
    />
  );
});