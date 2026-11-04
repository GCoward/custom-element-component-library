import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { CeButton, CeDisclosure, CeTextField } from "@gcoward/custom-elements";

type Props<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ce-button": Props<CeButton> & { disabled?: boolean };
      "ce-disclosure": Props<CeDisclosure> & { open?: boolean };
      "ce-text-field": Props<CeTextField> & {
        label?: string;
        name?: string;
        value?: string;
        required?: boolean;
        disabled?: boolean;
      };
    }
  }
}
