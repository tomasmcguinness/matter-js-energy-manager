import Link from 'next/link'

const Index = () => {
    return <div>
        Welcome to the project. I'm trying to build a simple tool to demonstrate how Matter energy management works.
        <Link href="/devices">Devices</Link>
    </div>;
}

export default Index;