import type { TextInputProps } from "react-native";
import { Input } from "./input";

interface FieldProps extends TextInputProps {
  error?: string;
  label: string;
}

export const Field = (props: FieldProps) => <Input {...props} />;
