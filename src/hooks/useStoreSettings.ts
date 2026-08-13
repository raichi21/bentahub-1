import { useStoreSettings as useStoreSettingsContext } from "@/components/store-settings-provider"

export function useStoreSettings() {
  return useStoreSettingsContext()
}
