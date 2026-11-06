import { Kanit } from 'next/font/google';

const kanit = Kanit({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['thai', 'latin'],
    display: 'swap',
});

export const metadata = {
    title: 'Dashboard | Haze-r2',
};

export default function DashboardLayout({ children }) {
    return <div className={`${kanit.className} antialiased`}>{children}</div>;
}
