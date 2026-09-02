import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
};

export function SearchableChipSelect({
  options,
  selected,
  onChange,
  placeholder = 'Rechercher...',
  multiple = false,
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = options.filter((o) => !selected.includes(o));
    const list = q ? available.filter((o) => o.toLowerCase().includes(q)) : available;
    return list.slice(0, 12);
  }, [options, query, selected]);

  const select = (value: string) => {
    onChange(multiple ? [...selected, value] : [value]);
    setQuery('');
  };

  const remove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const showInput = multiple || selected.length === 0;

  return (
    <View>
      {selected.length > 0 && (
        <View style={styles.selectedRow}>
          {selected.map((value) => (
            <TouchableOpacity key={value} style={styles.selectedChip} onPress={() => remove(value)}>
              <Text style={styles.selectedText}>{value} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showInput && (
        <>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder={placeholder} />
          <View style={styles.suggestions}>
            {filtered.map((option) => (
              <TouchableOpacity key={option} style={styles.suggestionChip} onPress={() => select(option)}>
                <Text style={styles.suggestionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && <Text style={styles.noResult}>Aucun pays trouvé</Text>}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  suggestionText: { fontSize: 13, color: '#333' },
  noResult: { fontSize: 13, color: '#999', marginTop: 4 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  selectedChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#132D46',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  selectedText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
