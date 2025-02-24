import "./App.css";
import { useState, useReducer, useRef, createContext, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Diary from "./pages/Diary";
import New from "./pages/New";
import Edit from "./pages/Edit";
import Notfound from "./pages/Notfound";
import axios from "axios";

function reducer(state, action) {
  let nextState;

  switch (action.type) {
    case "INIT": {
      console.log(action.data);
      return action.data;
    }
    case "CREATE": {
      nextState = [action.data, ...state];
      break;
    }
    case "UPDATE": {
      nextState = state.map((item) =>
        String(item.id) === String(action.data.id) ? action.data : item
      );
      break;
    }
    case "DELETE": {
      nextState = state.filter((item) => String(item.id) !== String(action.id));
      break;
    }
    default:
      return state;
  }

  localStorage.setItem("diary", JSON.stringify(nextState));
  return nextState;
}

export const DiaryStateContext = createContext();
export const DiaryDispatchContext = createContext();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, dispatch] = useReducer(reducer, []);
  const idRef = useRef(0);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/diaries")
      .then((response) => {
        dispatch({ type: "INIT", data: response.data });
        // 현재 데이터의 가장 큰 ID 찾기
        const maxId = response.data.reduce(
          (max, item) => Math.max(max, item.id),
          0
        );
        idRef.current = maxId + 1;
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("일기 데이터를 불러오는 데 실패했습니다.", error);
        setIsLoading(false);
      });
  }, []);

  // 새로운 일기 추가
  const onCreate = async (createdDate, emotionId, content) => {
    try {
      const response = await axios.post("http://localhost:8080/api/diaries", {
        createdDate,
        emotionId,
        content,
      });

      dispatch({
        type: "CREATE",
        data: response.data,
      });
    } catch (error) {
      console.error("일기 추가 실패", error);
    }
  };

  const onUpdate = async (id, createdDate, emotionId, content) => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/diaries/${id}`,
        {
          createdDate,
          emotionId,
          content,
        }
      );

      dispatch({
        type: "UPDATE",
        data: response.data,
      });
    } catch (error) {
      console.error("일기 수정 실패", error);
    }
  };

  const onDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/diaries/${id}`);
      dispatch({
        type: "DELETE",
        id,
      });
    } catch (error) {
      console.error("일기 삭제 실패", error);
    }
  };

  if (isLoading) {
    return <div>데이터 로딩중입니다...</div>;
  }

  return (
    <>
      <DiaryStateContext.Provider value={data}>
        <DiaryDispatchContext.Provider
          value={{
            onCreate,
            onUpdate,
            onDelete,
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<New />} />
            <Route path="/diary/:id" element={<Diary />} />
            <Route path="/edit/:id" element={<Edit />} />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </DiaryDispatchContext.Provider>
      </DiaryStateContext.Provider>
    </>
  );
}

export default App;
