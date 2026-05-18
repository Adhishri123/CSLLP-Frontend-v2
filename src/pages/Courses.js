import React, { useEffect, useState } from 'react';
import { getCourses } from '../services/api';
import { enrollCourse as enrollAPI } from '../services/courseApi'; // optional new file mapping enroll

export default function Courses({ user }){
  const [courses, setCourses] = useState([]);
  useEffect(()=>{ getCourses().then(r => { if (r.ok) setCourses(r.body.data || []); }); }, []);
  return (
    <div>
      <h3>Courses</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16}}>
        {courses.map(c => (
          <div key={c.id} style={{background:'#fff',padding:16,borderRadius:8}}>
            <h4>{c.title}</h4>
            <p>{c.description}</p>
            <div>Duration: {c.durationHours}h</div>
            <button onClick={()=>{/* call enroll API */}}>Enroll</button>
          </div>
        ))}
      </div>
    </div>
  );
}
