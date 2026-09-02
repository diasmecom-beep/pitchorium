import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Option = { value: string; label: string };

type Props = {
  options: readonly (string | Option)[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
};

function normalize(option: string | Option): Option {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function ChipSelect({ options, selected, onChange, multiple = true }: Props) {
  const toggle = (value: string) => {
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <View style={styles.wrap}>
      {options.map((raw) => {
        const option = normalize(raw);
        const active = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => toggle(option.value)}
          >
            <Text style={active ? styles.chipTextActive : styles.chipText}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: '#132D46', borderColor: '#132D46' },
  chipText: { color: '#333', fontSize: 14 },
  chipTextActive: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
