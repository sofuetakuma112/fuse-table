import { useRef, useEffect } from "react";

export function usePrevious<T>(value: any, initValue: T) {
  const ref = useRef<T>(initValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
