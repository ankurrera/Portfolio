import { useParams, Navigate } from "react-router-dom";

const validCategories = ['selected', 'commissioned', 'editorial', 'personal', 'all'];

const CategoryRedirect = () => {
  const { category } = useParams<{ category: string }>();
  
  // Validate category
  const isValidCategory = category && validCategories.includes(category.toLowerCase());
  
  if (isValidCategory) {
    return <Navigate to={`/photoshoots/${category}`} replace />;
  }
  
  // If invalid category, redirect to home
  return <Navigate to="/" replace />;
};

export default CategoryRedirect;
