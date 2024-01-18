import { classNames } from "@utils";
import { QUANTUM_CLASS } from "@utils/constants";
import quantumIconSvg from "@assets/img/quantum.svg";

export default function contextIcon() {
  return (
    <div
      className={classNames(QUANTUM_CLASS, "icon")}
      dangerouslySetInnerHTML={{ __html: quantumIconSvg }}
    />
  );
}
