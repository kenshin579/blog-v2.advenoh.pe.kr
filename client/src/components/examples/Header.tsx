import { Header } from '../Header';

export default function HeaderExample() {
  return <Header onSearchClick={() => console.log('Search clicked')} />;
}
