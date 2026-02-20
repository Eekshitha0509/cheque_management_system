from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import render
from django.http import JsonResponse
from cheque.models import cheque
from .serializers import chequeSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.views import APIView
from account.models import User
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer

# Create your views here.

@api_view(['GET', 'POST'])
def cheque_details(request):
    if request.method == 'GET':
        # to display all thedata from the table
        cheque_details = cheque.objects.all()
        serializers = chequeSerializer(cheque_details,many = True)
        return Response(serializers.data,status = status.HTTP_200_OK)
    elif request.method == 'POST':
        serializers = chequeSerializer(data = request.data)
        if serializers.is_valid():
            serializers.save()
            return Response(serializers.data,status=status.HTTP_201_CREATED)
        return Response(serializers.errors,status = status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET','PUT','DELETE'])  
def cheque_id_view(request,pk):
    try:
        cheque_obj = cheque.objects.get(pk=pk)
    except:
        return Response(status = status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializers = chequeSerializer(cheque_obj)
        return Response(serializers.data,status=status.HTTP_200_OK)
    elif request.method == 'PUT':
            serializers = chequeSerializer(cheque_obj,data = request.data)        
            if serializers.is_valid():
               serializers.save()
               return Response(serializers.data,status=status.HTTP_200_OK)
            else:
                return Response(serializers.errors,status = status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        cheque_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class User_View(APIView):
    def get(self,request,pk=None):
        users = User.objects.all()
        serializer = UserSerializer(users,many = True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    def post(self,request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
class User_id_view(APIView):
    def get_object(self, pk):
        try:
           users = User.get(pk=pk)
        except:
           return Response(status = status.HTTP_404_NOT_FOUND)
    def put(self,request,pk):
        users = self.get_object(pk=pk)
        serializer = UserSerializer(users,data = request.data,partial = True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    def delete(self,request,pk):
        users = self.get_object(pk=pk)
        users.delete()
        return Response({"message": "User deleted"}, status=status.HTTP_204_NO_CONTENT)


    

