import CompanyDetail from "./CompanyDetail";

export default function SubcontractorProfile({ params }: { params: { id: string } }) {
  return (
    <CompanyDetail
      params={params}
      returnPath="/subcontractor-dashboard"
      returnLabel="Back to Subcontractor Operations"
    />
  );
}
