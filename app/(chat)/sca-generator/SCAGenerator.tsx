import dynamic from 'next/dynamic';

const SCAGeneratorClient = dynamic(
  () => import('./SCAGeneratorClient').then((mod) => mod.default),
  { ssr: false }
);

const SCAGenerator: React.FC = () => {
  return <SCAGeneratorClient />;
};

export default SCAGenerator;