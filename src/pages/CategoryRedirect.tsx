import { useParams, Navigate } from "react-router-dom";

const validCategories = ['selected', 'commissioned', 'editorial', 'personal', 'all'];

const CategoryRedirect = () => {
  const { category } = useParams<{ category: string }>();
  
  // Validate category
  const isValidCategory = category && validCategories.includes(category.toLowerCase());
  
  if (isValidCategory) {
    const lowerCategory = category.toLowerCase();
    // Redirect 'all' to the photoshoots parent page
    if (lowerCategory === 'all') {
      return <Navigate to="/photoshoots" replace />;
    }
    // Ensure lowercase for consistent URLs
    return <Navigate to={`/photoshoots/${lowerCategory}`} replace />;
  }
  
  // If invalid category, redirect to home
  return <Navigate to="/" replace />;
};

export default CategoryRedirect;
