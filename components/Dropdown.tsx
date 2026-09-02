import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export type DropdownOption = { value: string; label: string };

export function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <>
      <TouchableOpacity style={[styles.trigger, value && styles.triggerActive]} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, value && styles.triggerTextActive]} numberOfLines={1}>
          {selectedLabel ?? label}
        </Text>
        <Text style={[styles.chevron, value && styles.triggerTextActive]}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={[{ value: '', label: 'Toutes / Tous' }, ...options]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value || null);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, (item.value || null) === value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  triggerActive: { backgroundColor: COLORS.accent },
  triggerText: { color: COLORS.accent, fontWeight: '600', fontSize: 13, maxWidth: 110 },
  triggerTextActive: { color: '#fff' },
  chevron: { color: COLORS.accent, fontSize: 11 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionText: { fontSize: 15, color: COLORS.textPrimary },
  optionTextActive: { color: COLORS.accent, fontWeight: '700' },
});
