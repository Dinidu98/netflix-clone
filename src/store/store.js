import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { BASE_URL, KEY } from "../utils/constants";
import axios from "axios";

const initialState = {
  movies: [],
  genresLoaded: false,
  genres: [],
};

export const getGenres = createAsyncThunk("netflix/genres", async () => {
  const {
    data: { genres },
  } = await axios.get(`${BASE_URL}/genre/movie/list?api_key=${KEY}`);
  // console.log(genres);
  return genres;
});

const createArrayFromRawData = (array, moviesArray, genres) => {
  array.forEach((movie) => {
    const movieGenres = [];
    movie.genre_ids.forEach((genre) => {
      const name = genres.find(({ id }) => id === genre);
      if (name) movieGenres.push(name.name);
    });
    if (movie.backdrop_path)
      moviesArray.push({
        id: movie.id,
        name: movie?.original_name ? movie.original_name : movie.original_title,
        image: movie.backdrop_path,
        genres: movieGenres.slice(0, 3),
      });
  });
};

const getRawData = async (api, genres, paging) => {
  const moviesArray = [];
  for (let i = 1; moviesArray.length < 60 && i < 10; i++) {
    const { data: {results} } = await axios.get(
      `${api}${paging ? `&page=${i}` : ""}`
    );
    createArrayFromRawData(results, moviesArray, genres);
    
  }
  return moviesArray;
  // console.log({moviesArray})
};

export const fetchDataByGenre = createAsyncThunk(
  "netflix/moviesByGenres",
  async ({ genre, type }, thunkApi) => {
    const {
      netflix: { genres },
    } = thunkApi.getState();
    const data= getRawData(
      `${BASE_URL}/discover/${type}?api_key=${KEY}&with_genres=${genre}`,
      genres
    );
    
    return data
    ;
  }
);

export const getMovies = createAsyncThunk(
  "netflix/trending",
  async ({ type }, thunkApi) => {
    const {
      netflix: { genres },
    } = thunkApi.getState();
    return getRawData(
      `${BASE_URL}/trending/${type}/week?api_key=${KEY}`,
      genres,
      true
    );

  }
);

const NetflixSlice = createSlice({
  name: "Netflix",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(getGenres.fulfilled, (state, action) => {
      state.genres = action.payload;
      state.genresLoaded = true;
    });

    builder.addCase(getMovies.fulfilled, (state, action) => {
        state.movies = action.payload;
      });

      builder.addCase(fetchDataByGenre.fulfilled, (state, action) => {
        state.movies = action.payload;
      });
  },
});


export const store = configureStore({
  reducer: {
    netflix: NetflixSlice.reducer,
  },
});
