import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseById, getMaterialsForCourse, enrollCourse } from "../services/api";
import { Button } from "@/components/ui/button";
import MaterialViewer from "../components/MaterialViewer";

const CourseDetailPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    getCourseById(id).then(res => setCourse(res.data.data));
    getMaterialsForCourse(id).then(res => setMaterials(res.data.data));
  }, [id]);

  const handleEnroll = () => {
    enrollCourse({ courseId: course.id, employeeId: 1 }) // demo employeeId
      .then(() => alert("Enrolled successfully"));
  };

  if (!course) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">{course.title}</h2>
      <p>{course.description}</p>

      <Button className="mt-4" onClick={handleEnroll}>Enroll</Button>

      <h3 className="text-xl mt-6">Materials</h3>
      <div className="grid grid-cols-2 gap-4">
        {materials.map(mat => (
          <MaterialViewer key={mat.id} material={mat} />
        ))}
      </div>
    </div>
  );
};

export default CourseDetailPage;
