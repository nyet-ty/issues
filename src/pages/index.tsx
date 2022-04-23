import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../utils/createFetcher';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { routes } from '../hooks/router';

const fetcher = createFetcher((user) => ({
    goalUserIndex: [
        {
            user,
        },
        {
            id: true,
            title: true,
            description: true,
            state: {
                id: true,
                title: true,
            },
            computedIssuer: {
                id: true,
                name: true,
                email: true,
            },
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
            tags: {
                id: true,
                title: true,
                description: true,
                color: true,
            },
            createdAt: true,
            updatedAt: true,
        },
    ],
}));

const Home: NextPage<{ user: Session['user']; data: any }> = ({ user, data: ssrData }) => {
    const t = useTranslations('index');
    const { data } = useSWR('goalUserIndex', () => fetcher(user));
    const actualData: typeof data = data ?? ssrData;

    return (
        <>
            <Head>
                <title>{t('title')}</title>
            </Head>

            <Header />

            <SearchBar />

            <div>{JSON.stringify(actualData?.goalUserIndex)}</div>
        </>
    );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
    const session = await getSession({ req });

    if (!session) {
        return {
            redirect: {
                destination: routes.signIn(),
                permanent: false,
            },
        };
    }

    return {
        props: {
            data: await fetcher(session.user),
            user: session.user,
            i18n: (await import(`../../i18n/${locale}.json`)).default,
        },
    };
};
