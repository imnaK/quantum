import contextIcon from "@components/ContextIcon";

export function getAllTextOfElement(element) {
  const children = Array.from(element.querySelectorAll("*"));
  const text = children
    .map((child) => child.textContent.replace(/\s/g, ""))
    .join("");
  return text;
}

export function createContextMenu(ContextMenu, label, action, customIcon) {
  return ContextMenu.buildItem({
    label: label,
    type: "text",
    icon: customIcon || contextIcon,
    action: action,
  });
}

export function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

export function modifyElements(messageElement, querySelector, modifyFunction) {
  const allSpanElements = messageElement.querySelectorAll(querySelector);
  allSpanElements.forEach(modifyFunction);
}

// not very generic but works for now
export function createSpan(className, textContent, styles) {
  const spanElement = document.createElement("span");
  spanElement.className = className;
  spanElement.textContent = textContent;
  if (styles) {
    for (let key in styles) {
      spanElement.style[key] = styles[key];
    }
  }
  return spanElement;
}
