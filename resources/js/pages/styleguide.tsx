import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import ColorsType from './styleguide/sections/colors-type';
import Controls from './styleguide/sections/controls';
import Data from './styleguide/sections/data';
import Feedback from './styleguide/sections/feedback';

/** Local-only. Toggle light/dark with the theme button in the top bar. */
export default function Styleguide() {
    return (
        <>
            <Head title="Styleguide" />
            <PageContainer className="space-y-10">
                <h1 className="text-2xl font-semibold">Styleguide</h1>
                <ColorsType />
                <Controls />
                <Feedback />
                <Data />
            </PageContainer>
        </>
    );
}
