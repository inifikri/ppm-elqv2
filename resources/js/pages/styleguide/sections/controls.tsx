import { Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/form-field';
import { SelectField } from '@/components/select-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Row, Section } from './section';

export default function Controls() {
    return (
        <>
            <Section id="sg-buttons" title="Button">
                <Row>
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Danger</Button>
                    <Button size="icon" aria-label="Tambah">
                        <Plus />
                    </Button>
                </Row>
                <Row>
                    <Button size="sm">Small</Button>
                    <Button size="lg">Large</Button>
                    <Button disabled>Disabled</Button>
                    <Button loading>Menyimpan…</Button>
                    <Button variant="destructive">
                        <Trash2 /> Hapus
                    </Button>
                </Row>
                <p className="text-sm text-text-muted">
                    Fokus: tekan Tab pada kontrol mana pun (ring 2px + offset).
                </p>
            </Section>
            <Section id="sg-forms" title="Form">
                <div className="grid max-w-[720px] gap-4">
                    <FormField
                        id="sg-name"
                        label="Input"
                        description="Teks bantuan."
                    >
                        <Input id="sg-name" placeholder="Nama" />
                    </FormField>
                    <FormField
                        id="sg-err"
                        label="Input error"
                        error="Wajib diisi."
                    >
                        <Input
                            id="sg-err"
                            aria-invalid
                            aria-describedby="sg-err-error"
                        />
                    </FormField>
                    <FormField id="sg-dis" label="Input disabled">
                        <Input
                            id="sg-dis"
                            disabled
                            defaultValue="Tidak dapat diubah"
                        />
                    </FormField>
                    <FormField id="sg-ta" label="Textarea">
                        <Textarea id="sg-ta" />
                    </FormField>
                    <FormField id="sg-date" label="Tanggal">
                        <Input id="sg-date" type="date" />
                    </FormField>
                    <SelectField
                        id="sg-sel"
                        name="sel"
                        label="Select"
                        placeholder="Pilih…"
                        options={[
                            { value: 1, label: 'Satu' },
                            { value: 2, label: 'Dua' },
                        ]}
                    />
                    <Row>
                        <Label className="gap-2">
                            <Checkbox /> Checkbox
                        </Label>
                        <Label className="gap-2">
                            <Switch /> Switch
                        </Label>
                    </Row>
                    <RadioGroup defaultValue="a" className="flex gap-4">
                        <Label className="gap-2">
                            <RadioGroupItem value="a" /> A
                        </Label>
                        <Label className="gap-2">
                            <RadioGroupItem value="b" /> B
                        </Label>
                    </RadioGroup>
                </div>
            </Section>
        </>
    );
}
