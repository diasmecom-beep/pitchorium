import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Dropdown } from './Dropdown';
import { COLORS, RADIUS } from '../constants/theme';
import { AFRICA_ACP_COUNTRIES } from '../constants/countries';
import { SECTORS } from '../constants/taxonomy';

export type ProjectFilters = {
  country: string | null;
  sector: string | null;
  state: string | null;
  query: string;
};

const STATE_OPTIONS = [
  { value: 'published', label: 'En financement' },
  { value: 'funded', label: 'Financé' },
  { value: 'closed', label: 'Clôturé' },
];

const COUNTRY_OPTIONS = AFRICA_ACP_COUNTRIES.map((c) => ({ value: c, label: c }));
const SECTOR_OPTIONS = SECTORS.map((s) => ({ value: s, label: s }));

export function ProjectSearchToolbar({
  filters,
  onChange,
}: {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Dropdown
          label="Localisation"
          options={COUNTRY_OPTIONS}
          value={filters.country}
          onChange={(country) => onChange({ ...filters, country })}
        />
        <Dropdown
          label="Catégorie"
          options={SECTOR_OPTIONS}
          value={filters.sector}
          onChange={(sector) => onChange({ ...filters, sector })}
        />
        <Dropdown
          label="Etat"
          options={STATE_OPTIONS}
          value={filters.state}
          onChange={(state) => onChange({ ...filters, state })}
        />
      </View>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor={COLORS.textMuted}
          value={filters.query}
          onChangeText={(query) => onChange({ ...filters, query })}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  searchIcon: { fontSize: 14, marginLeft: 8 },
});
