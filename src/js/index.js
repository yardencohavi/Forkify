import { clearLoader, elements, renderLoader } from "./views/base";
import Search from "./models/Search";
import List from "./models/List";
import Likes from "./models/Likes";
import Recipe from "./models/Recipe";
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
//Global state of our app 
const state = {};
/**
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {

    const query = searchView.getInput();

    if(query){
        state.search = new Search(query);

        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        await state.search.getResults();
        clearLoader();
        searchView.renderResults(state.search.result);
    }
}
elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();
})
elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    console.log(btn);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
})

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');

    if(id){
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

         // Highlight selected search item
         if (state.search) searchView.highLightSelected(id);

        state.recipe = new Recipe(id);
        try{
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        }catch(error){
            console.log(error);
            alert('error processing recipe!');
        }

    }
}

['hashchange', 'load'].forEach( event => window.addEventListener(event, controlRecipe));


/**
 * LIST CONTROLLER
 */

const controlList = () => {
    if(!state.list){
        state.list = new List();
    }
    state.recipe.ingredients.forEach( el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);
    })
}
/**
 * LIKE CONTROLLER
 */
 state.likes = new Likes();
 likesView.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    if(!state.likes.isLiked(currentID)){
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )
        likesView.toggleLikeBtn(true);
        likesView.renderLike(newLike);
        console.log(state.likes);
    }else {
        state.likes.deleteLike(currentID);
        likesView.toggleLikeBtn(false);
        likesView.deleteLike(currentID);
        console.log(state.likes);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}
window.addEventListener("load", () => {
    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

//Handling recipe buttons clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIng(state.recipe);
        }
    }else if (e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServings('inc');
        recipeView.updateServingsIng(state.recipe);
    }
    else if (e.target.matches('.recipe__btn, .recipe__btn *')){
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
    
})
elements.shopping.addEventListener("click", e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        state.list.deleteItem(id);
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value,10);
        state.list.updateCount(id,val);
    } 
})