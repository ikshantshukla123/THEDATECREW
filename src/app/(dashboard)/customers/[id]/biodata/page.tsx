import { requireSession } from "@/lib/auth/session";
import { getClientDetail } from "@/features/customers/service";
import { BiodataSection, Chips } from "@/features/customers/components/biodata-section";
import { RevealContact } from "@/features/customers/components/reveal-contact";
import { age, formatHeight, formatIncome, titleCase } from "@/lib/format";

const DATE = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export default async function BiodataPage({
  params,
}: PageProps<"/customers/[id]/biodata">) {
  const { id } = await params;
  const session = await requireSession();
  const c = await getClientDetail(session.matchmakerId, id);
  const p = c.preference;

  return (
    <div className="flex flex-col gap-5">
      <BiodataSection
        title="Basics"
        fields={[
          { label: "Gender", value: titleCase(c.gender) },
          { label: "Date of birth", value: `${DATE.format(c.dateOfBirth)} · ${age(c.dateOfBirth)} years` },
          { label: "Height", value: `${formatHeight(c.heightCm)} (${c.heightCm} cm)` },
          { label: "Marital status", value: titleCase(c.maritalStatus) },
          { label: "Profile created by", value: titleCase(c.profileCreatedBy) },
          { label: "Verification", value: c.isVerified ? "ID and phone verified" : "Not verified" },
        ]}
      />

      <BiodataSection
        title="Location"
        fields={[
          { label: "City", value: c.city },
          { label: "State", value: c.state },
          { label: "Country", value: c.country },
          { label: "Open to relocate", value: titleCase(c.openToRelocate) },
        ]}
      />

      <BiodataSection
        title="Education & career"
        fields={[
          { label: "College", value: c.undergradCollege },
          { label: "Degree", value: c.degree },
          { label: "Highest education", value: titleCase(c.highestEducation) },
          { label: "Company", value: c.company },
          { label: "Designation", value: c.designation },
          { label: "Annual income", value: `${formatIncome(c.annualIncome)} / year` },
        ]}
      />

      <BiodataSection
        title="Family"
        fields={[
          { label: "Family type", value: titleCase(c.familyType) },
          { label: "Family values", value: titleCase(c.familyValues) },
          { label: "Father's occupation", value: c.fatherOccupation },
          { label: "Mother's occupation", value: c.motherOccupation },
          { label: "Brothers", value: String(c.brothers) },
          { label: "Sisters", value: String(c.sisters) },
        ]}
      />

      <BiodataSection
        title="Religion & community"
        fields={[
          { label: "Religion", value: c.religion },
          { label: "Caste", value: c.caste },
          { label: "Sub-caste", value: c.subCaste },
          { label: "Gotra", value: c.gotra },
          { label: "Mother tongue", value: c.motherTongue },
          { label: "Manglik", value: titleCase(c.manglik) },
          { label: "Languages known", value: c.languages.join(", ") },
        ]}
      />

      <BiodataSection
        title="Lifestyle"
        fields={[
          { label: "Diet", value: titleCase(c.diet) },
          { label: "Smoking", value: titleCase(c.smoking) },
          { label: "Drinking", value: titleCase(c.drinking) },
          { label: "Open to pets", value: titleCase(c.openToPets) },
        ]}
      />

      <BiodataSection
        title="Intentions"
        fields={[
          { label: "Wants children", value: titleCase(c.wantKids) },
          { label: "Open to relocate", value: titleCase(c.openToRelocate) },
        ]}
      />

      <BiodataSection title="Partner preferences">
        {p ? (
          <div className="flex flex-col gap-5">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Pair label="Age" value={p.minAge && p.maxAge ? `${p.minAge}–${p.maxAge} years` : null} />
              <Pair
                label="Height"
                value={
                  p.minHeightCm && p.maxHeightCm
                    ? `${formatHeight(p.minHeightCm)} – ${formatHeight(p.maxHeightCm)}`
                    : null
                }
              />
              <Pair label="Minimum income" value={p.minIncome ? `${formatIncome(p.minIncome)} / year` : null} />
              <Pair label="Caste" value={p.casteNoBar ? "No bar" : p.castes.join(", ") || null} />
              <Pair label="Accepts divorced" value={p.acceptDivorced ? "Yes" : "No"} />
              <Pair label="Manglik matters" value={p.manglikMatters ? "Yes" : "No"} />
            </dl>

            <div>
              <p className="mb-2 text-[13px] font-medium text-fg-muted">Religions</p>
              <Chips items={p.religions} empty="Any religion" />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-fg-muted">Mother tongues</p>
              <Chips items={p.motherTongues} empty="Any mother tongue" />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-fg-muted">Cities</p>
              <Chips items={p.cities} empty="Any city" />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-fg-muted">Diet</p>
              <Chips items={p.diets.map(titleCase)} empty="Any diet" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-subtle">No preferences recorded yet.</p>
        )}
      </BiodataSection>

      <BiodataSection title="Contact">
        <RevealContact profileId={c.id} />
      </BiodataSection>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[13px] font-medium text-fg-muted">{label}</dt>
      <dd className={value ? "mt-0.5 text-sm text-fg" : "mt-0.5 text-sm text-fg-subtle"}>
        {value || "Not specified"}
      </dd>
    </div>
  );
}
