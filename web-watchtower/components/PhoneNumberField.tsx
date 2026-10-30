"use client";
import PhoneInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneNumberFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  country?: Country;
  onCountryChange?: (country: Country | undefined) => void;
  defaultCountry?: Country;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

/**
 * International phone input shared by signup and Settings: a flag/country
 * picker plus a number field that outputs E.164 (the format the backend's
 * PhoneNumberNormalizer expects back, so round-tripping a saved number
 * through this field never re-triggers its own validation).
 */
export function PhoneNumberField({
  id,
  value,
  onChange,
  country,
  onCountryChange,
  defaultCountry = "NG",
  placeholder = "Phone number",
  error,
  disabled,
}: PhoneNumberFieldProps) {
  return (
    <PhoneInput
      id={id}
      international
      value={value}
      onChange={(v) => onChange(v ?? "")}
      country={country}
      defaultCountry={defaultCountry}
      onCountryChange={onCountryChange}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={error}
      className={`watchtower-phone-field ${error ? "watchtower-phone-field--error" : ""}`}
      numberInputProps={{ className: "watchtower-phone-field__input" }}
    />
  );
}
